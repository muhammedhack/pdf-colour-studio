import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PageFilterConfig } from '../types/filters';
import { applyFiltersToCanvas } from '../lib/filters/canvasFilters';
import { CheckCheck, RotateCcw } from 'lucide-react';

interface PageThumbnailsProps {
  doc: pdfjs.PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  onSelectPage: (pageNum: number) => void;
  getPageConfig: (pageNum: number) => PageFilterConfig;
  isPageCustomized: (pageNum: number) => boolean;
  onApplyToAll: () => void;
  onResetAll: () => void;
  onResetCurrent: () => void;
}

const PageThumbnailItem: React.FC<{
  pageNum: number;
  isSelected: boolean;
  isCustomized: boolean;
  thumbUrl?: string;
  onSelect: (p: number) => void;
  onRequestRender: (p: number) => void;
}> = React.memo(({ pageNum, isSelected, isCustomized, thumbUrl, onSelect, onRequestRender }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el || thumbUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onRequestRender(pageNum);
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, thumbUrl, onRequestRender]);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  return (
    <div
      ref={itemRef}
      onClick={() => onSelect(pageNum)}
      className={`relative group rounded-xl p-2 transition-all cursor-pointer border flex flex-col items-center ${
        isSelected
          ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white shadow-2xs'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="w-full aspect-[1/1.41] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner border border-slate-100">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={`Page ${pageNum} thumbnail`}
            className="w-full h-full object-contain pointer-events-none transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
            <span className="text-[11px] animate-pulse">Loading...</span>
            <span className="text-[10px] text-slate-400/80">Page {pageNum}</span>
          </div>
        )}

        {/* Customized badge */}
        {isCustomized && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-xs">
            Custom
          </span>
        )}
      </div>

      {/* Page Number Indicator */}
      <div className="w-full mt-1.5 flex items-center justify-between text-xs px-1">
        <span className={`font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-600'}`}>
          Page {pageNum}
        </span>
        {isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
        )}
      </div>
    </div>
  );
});

PageThumbnailItem.displayName = 'PageThumbnailItem';

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  doc,
  currentPage,
  totalPages,
  onSelectPage,
  getPageConfig,
  isPageCustomized,
  onApplyToAll,
  onResetCurrent,
}) => {
  const [renderedThumbs, setRenderedThumbs] = useState<Map<number, string>>(new Map());
  const baseCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderQueueRef = useRef<number[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const maxCachedCanvases = 60;

  // Process rendering queue sequentially to keep UI completely smooth
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (renderQueueRef.current.length > 0) {
      const pageNum = renderQueueRef.current.shift();
      if (!pageNum || pageNum < 1 || pageNum > totalPages) continue;

      try {
        let baseCanvas = baseCanvasesRef.current.get(pageNum);
        if (!baseCanvas) {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.28 });
          baseCanvas = document.createElement('canvas');
          baseCanvas.width = Math.floor(viewport.width);
          baseCanvas.height = Math.floor(viewport.height);

          const ctx = baseCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
            await page.render({
              canvasContext: ctx,
              viewport,
              canvas: null,
            }).promise;
          }
          page.cleanup();

          // Evict oldest cached base canvas if exceeding limit to prevent memory bloat
          if (baseCanvasesRef.current.size >= maxCachedCanvases) {
            const firstKey = baseCanvasesRef.current.keys().next().value;
            if (firstKey) baseCanvasesRef.current.delete(firstKey);
          }
          baseCanvasesRef.current.set(pageNum, baseCanvas);
        }

        const config = getPageConfig(pageNum);
        const filtered = document.createElement('canvas');
        applyFiltersToCanvas(baseCanvas, filtered, config.presetId, config.adjustments);
        const dataUrl = filtered.toDataURL('image/jpeg', 0.8);

        setRenderedThumbs((prev) => {
          const next = new Map(prev);
          next.set(pageNum, dataUrl);
          return next;
        });

        // Yield execution to keep main thread fluid
        await new Promise((r) => setTimeout(r, 10));
      } catch (err) {
        console.error(`Failed to render thumbnail for page ${pageNum}:`, err);
      }
    }

    isProcessingQueueRef.current = false;
  }, [doc, totalPages, getPageConfig]);

  // Request to render a specific page thumbnail
  const requestRender = useCallback(
    (pageNum: number) => {
      setRenderedThumbs((prev) => {
        if (!prev.has(pageNum) && !renderQueueRef.current.includes(pageNum)) {
          renderQueueRef.current.push(pageNum);
          processQueue();
        }
        return prev;
      });
    },
    [processQueue]
  );

  // Initial and priority load: render pages surrounding currentPage immediately
  useEffect(() => {
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 6);
    for (let p = start; p <= end; p++) {
      if (!renderQueueRef.current.includes(p)) {
        renderQueueRef.current.unshift(p);
      }
    }
    processQueue();
  }, [doc, totalPages, currentPage, processQueue]);

  // Re-run filter on cached thumbnails whenever page configs update
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderedThumbs((prev) => {
        if (prev.size === 0) return prev;
        const next = new Map(prev);
        baseCanvasesRef.current.forEach((baseCanvas, p) => {
          if (prev.has(p)) {
            const config = getPageConfig(p);
            const filtered = document.createElement('canvas');
            applyFiltersToCanvas(baseCanvas, filtered, config.presetId, config.adjustments);
            next.set(p, filtered.toDataURL('image/jpeg', 0.8));
          }
        });
        return next;
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [getPageConfig, currentPage]);

  return (
    <div className="flex flex-col h-full bg-slate-50/70 border-r border-slate-200/80">
      {/* Top Header & Quick Actions */}
      <div className="p-3 border-b border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pages ({totalPages})
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Selected: <span className="font-semibold text-slate-800">Page {currentPage}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={onApplyToAll}
            title="Copy current page filter to every page in the PDF"
            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Apply to All
          </button>

          <button
            type="button"
            onClick={onResetCurrent}
            title="Reset current page to default"
            className="p-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <PageThumbnailItem
            key={pageNum}
            pageNum={pageNum}
            isSelected={currentPage === pageNum}
            isCustomized={isPageCustomized(pageNum)}
            thumbUrl={renderedThumbs.get(pageNum)}
            onSelect={onSelectPage}
            onRequestRender={requestRender}
          />
        ))}
      </div>
    </div>
  );
};
