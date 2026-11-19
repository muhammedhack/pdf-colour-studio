import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PageFilterConfig } from '../types/filters';
import { PDFPageRenderer } from '../lib/pdf/pdfRenderer';
import { applyFiltersToCanvas } from '../lib/filters/canvasFilters';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RefreshCw,
  Brain,
} from 'lucide-react';

interface PDFViewerProps {
  renderer: PDFPageRenderer;
  currentPage: number;
  totalPages: number;
  filterConfig: PageFilterConfig;
  onPageChange: (newPage: number) => void;
  onResetPage: () => void;
  onOpenOCR?: () => void;
  isOCRActive?: boolean;
  hasOCRResult?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  renderer,
  currentPage,
  totalPages,
  filterConfig,
  onPageChange,
  onOpenOCR,
  isOCRActive,
  hasOCRResult,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const pristineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [zoomScale, setZoomScale] = useState<number>(isMobile ? 0.95 : 1.25);
  const [isRenderingBase, setIsRenderingBase] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInputVal, setPageInputVal] = useState<string>(String(currentPage));

  const animFrameRef = useRef<number | null>(null);

  // Sync page input field with currentPage
  useEffect(() => {
    setPageInputVal(String(currentPage));
  }, [currentPage]);

  // 2. Render Filter onto Display Canvas instantly (using requestAnimationFrame)
  const renderFilteredDisplay = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      const source = pristineCanvasRef.current;
      const target = displayCanvasRef.current;
      if (!source || !target) return;

      applyFiltersToCanvas(source, target, filterConfig.presetId, filterConfig.adjustments);
    });
  }, [filterConfig]);

  // 1. Render Base PDF Page whenever currentPage or zoomScale changes
  useEffect(() => {
    let isCancelled = false;
    setIsRenderingBase(true);

    const renderBasePage = async () => {
      try {
        // High-DPI preview scale (Optimized for mobile 60 FPS)
        const maxDpr = isMobile ? 1.25 : 2;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        const renderScale = zoomScale * dpr;

        const pristine = await renderer.renderPagePristine(currentPage, renderScale);

        if (!isCancelled) {
          pristineCanvasRef.current = pristine;
          setIsRenderingBase(false);
          renderFilteredDisplay();
        }
      } catch {
        if (!isCancelled) {
          setIsRenderingBase(false);
        }
      }
    };

    renderBasePage();

    return () => {
      isCancelled = true;
      renderer.cancelPageRender(currentPage);
    };
  }, [renderer, currentPage, zoomScale, renderFilteredDisplay]);

  // Trigger fast instant filter update whenever filterConfig changes
  useEffect(() => {
    renderFilteredDisplay();
  }, [renderFilteredDisplay]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.6));
  };

  const handleFitWidth = () => {
    if (containerRef.current && pristineCanvasRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      const estimatedScale = Math.max(0.8, Math.min(containerWidth / 700, 2.2));
      setZoomScale(Number(estimatedScale.toFixed(2)));
    } else {
      setZoomScale(1.0);
    }
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  // Page input submission
  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInputVal, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setPageInputVal(String(currentPage));
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full bg-slate-900/5 select-none ${
        isFullscreen ? 'bg-slate-900 p-4' : ''
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className="z-20 w-full px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
        {/* Page Navigation */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageSubmit} className="flex items-center space-x-1">
            <input
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={handlePageSubmit}
              className="w-10 text-center font-semibold text-xs py-1 px-1 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-indigo-500"
            />
            <span className="text-xs text-slate-500 font-medium">/ {totalPages}</span>
          </form>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* OCR Quick Action Button */}
        {onOpenOCR && (
          <button
            type="button"
            onClick={onOpenOCR}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isOCRActive
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
            }`}
            title="Scan & Read text with OCR"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-600" />
            <span>OCR Read</span>
            {hasOCRResult && (
              <span
                className={`w-2 h-2 rounded-full ${isOCRActive ? 'bg-white' : 'bg-emerald-500'} ml-0.5`}
                title="Page text recognized"
              />
            )}
          </button>
        )}

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomScale <= 0.6}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-mono font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoomScale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomScale >= 3.0}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

          <button
            type="button"
            onClick={handleFitWidth}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="relative inline-block shadow-2xl rounded-sm border border-slate-300/60 bg-white">
          {/* Subtle loading indicator overlay while rendering original vector */}
          {isRenderingBase && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center z-10 transition-opacity">
              <div className="flex items-center space-x-2 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering vector...</span>
              </div>
            </div>
          )}

          {/* The high-res display canvas */}
          <canvas
            ref={displayCanvasRef}
            className="max-w-none block mx-auto transition-transform duration-75"
            style={{
              width: pristineCanvasRef.current ? `${pristineCanvasRef.current.width / (window.devicePixelRatio || 1)}px` : 'auto',
              height: pristineCanvasRef.current ? `${pristineCanvasRef.current.height / (window.devicePixelRatio || 1)}px` : 'auto',
            }}
          />
        </div>
      </div>
    </div>
  );
};
