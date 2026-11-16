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
  const thumbnailCanvases = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Update thumbnails with their current filters
  const updateFilteredThumbs = useCallback(() => {
    const updated = new Map<number, string>();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const baseCanvas = thumbnailCanvases.current.get(pageNum);
      if (!baseCanvas) continue;

      const config = getPageConfig(pageNum);
      const filtered = document.createElement('canvas');
      applyFiltersToCanvas(baseCanvas, filtered, config.presetId, config.adjustments);
      updated.set(pageNum, filtered.toDataURL('image/jpeg', 0.8));
    }

    setRenderedThumbs(updated);
  }, [totalPages, getPageConfig]);

  // Render base low-res thumbnails when doc changes
  useEffect(() => {
    let isCancelled = false;

    const renderAllThumbnails = async () => {
      const baseCanvases = new Map<number, HTMLCanvasElement>();

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (isCancelled) break;
        try {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.28 }); // Low resolution for fast memory-efficient preview
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: ctx,
              viewport,
              canvas,
            }).promise;
          }
          page.cleanup();

          baseCanvases.set(pageNum, canvas);
          thumbnailCanvases.current.set(pageNum, canvas);

          // Yield execution to keep mobile main thread completely lag-free
          await new Promise((resolve) => setTimeout(resolve, 15));
        } catch {
          // ignore error
        }
      }

      if (!isCancelled) {
        updateFilteredThumbs();
      }
    };

    renderAllThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [doc, totalPages, updateFilteredThumbs]);

  // Re-run filter on thumbnails whenever page configs update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilteredThumbs();
    }, 100);
    return () => clearTimeout(timer);
  }, [updateFilteredThumbs, currentPage]);

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
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isSelected = currentPage === pageNum;
          const customized = isPageCustomized(pageNum);
          const thumbUrl = renderedThumbs.get(pageNum);

          return (
            <div
              key={pageNum}
              onClick={() => onSelectPage(pageNum)}
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
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Page {pageNum}
                  </div>
                )}

                {/* Customized badge */}
                {customized && (
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
        })}
      </div>
    </div>
  );
};
