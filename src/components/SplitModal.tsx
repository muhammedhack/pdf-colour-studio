import React, { useState, useEffect, useMemo } from 'react';
import * as pdfjs from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import {
  Scissors,
  X,
  Check,
  FileText,
  Archive,
  Layers,
  Sparkles,
  Zap,
  CheckCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { PageDimensions, ExportQuality, CompressionMode } from '../types/pdf';
import type { PageFilterConfig } from '../types/filters';
import type { SplitAction, SplitEngine, SplitProgress } from '../types/split';
import {
  parsePageRange,
  formatPageRange,
  splitPDFNative,
  splitPDFFiltered,
} from '../lib/pdf/pdfSplitter';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: pdfjs.PDFDocumentProxy;
  dimensions: PageDimensions[];
  pageConfigs: Map<number, PageFilterConfig>;
  defaultConfig: PageFilterConfig;
  arrayBuffer: ArrayBuffer;
  fileName: string;
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  doc,
  dimensions,
  pageConfigs,
  defaultConfig,
  arrayBuffer,
  fileName,
}) => {
  const totalPages = doc.numPages;

  // Selected pages state (1-based page numbers)
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [rangeInput, setRangeInput] = useState<string>('1');

  // Split strategy
  const [action, setAction] = useState<SplitAction>('extract-merged');
  const [engine, setEngine] = useState<SplitEngine>('filtered');
  const [splitEveryN, setSplitEveryN] = useState<number>(1);

  // Quality settings for filtered export
  const [quality] = useState<ExportQuality>('high');
  const [compressionMode] = useState<CompressionMode>('smart');

  // Page thumbnails cache
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());

  // Progress state
  const [progress, setProgress] = useState<SplitProgress>({
    isSplitting: false,
    percentage: 0,
    statusText: '',
    currentStep: 0,
    totalSteps: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // 1. Load quick mini-thumbnails when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const loadThumbs = async () => {
      const thumbs = new Map<number, string>();
      for (let p = 1; p <= totalPages; p++) {
        if (isCancelled) break;
        try {
          const page = await doc.getPage(p);
          const vp = page.getViewport({ scale: 0.22 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
            thumbs.set(p, canvas.toDataURL('image/jpeg', 0.7));
          }
          page.cleanup();
          // Yield main thread
          await new Promise((r) => setTimeout(r, 10));
        } catch {
          // ignore error
        }
      }
      if (!isCancelled) {
        setThumbnails(new Map(thumbs));
      }
    };

    loadThumbs();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, doc, totalPages]);

  // Sync range input when selectedPages changes
  const updateSelectedPages = (pages: number[]) => {
    const sorted = Array.from(new Set(pages))
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
    setSelectedPages(sorted);
    setRangeInput(formatPageRange(sorted));
  };

  // Handle manual typing into range input
  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parsePageRange(val, totalPages);
    setSelectedPages(parsed);
  };

  // Toggle a single page
  const togglePage = (pageNum: number) => {
    if (selectedPages.includes(pageNum)) {
      updateSelectedPages(selectedPages.filter((p) => p !== pageNum));
    } else {
      updateSelectedPages([...selectedPages, pageNum]);
    }
  };

  // Preset selectors
  const selectAll = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    updateSelectedPages(all);
  };

  const selectOdd = () => {
    const odd = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    updateSelectedPages(odd);
  };

  const selectEven = () => {
    const even = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    updateSelectedPages(even);
  };

  const clearSelection = () => {
    updateSelectedPages([]);
  };

  const invertSelection = () => {
    const currentSet = new Set(selectedPages);
    const inverted = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => !currentSet.has(p));
    updateSelectedPages(inverted);
  };

  // Calculate the page groups based on the chosen action
  const pageGroups = useMemo<number[][]>(() => {
    if (action === 'extract-merged') {
      return selectedPages.length > 0 ? [selectedPages] : [];
    }

    if (action === 'extract-separate') {
      // Each selected page is its own 1-page PDF
      return selectedPages.map((p) => [p]);
    }

    if (action === 'split-every') {
      // Split all pages into chunks of N
      const groups: number[][] = [];
      const chunk = Math.max(1, splitEveryN);
      for (let i = 1; i <= totalPages; i += chunk) {
        const group: number[] = [];
        for (let j = i; j < i + chunk && j <= totalPages; j++) {
          group.push(j);
        }
        groups.push(group);
      }
      return groups;
    }

    return [];
  }, [action, selectedPages, totalPages, splitEveryN]);

  // Execute the split
  const handleExecuteSplit = async () => {
    if (pageGroups.length === 0) {
      setError('Please select at least one page to split or extract.');
      return;
    }

    setError(null);
    setProgress({
      isSplitting: true,
      percentage: 5,
      statusText: 'Preparing split operation...',
      currentStep: 0,
      totalSteps: pageGroups.length,
    });

    try {
      if (engine === 'original') {
        // Native lossless vector split
        await splitPDFNative(arrayBuffer, pageGroups, fileName, setProgress);
      } else {
        // High-fidelity filtered split
        await splitPDFFiltered(
          doc,
          dimensions,
          pageConfigs,
          defaultConfig,
          quality,
          compressionMode,
          pageGroups,
          fileName,
          setProgress
        );
      }

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setTimeout(() => {
        setProgress((prev) => ({ ...prev, isSplitting: false }));
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to split PDF.';
      setError(msg);
      setProgress((prev) => ({ ...prev, isSplitting: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Split & Extract PDF Pages</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Extract custom pages or split document into multiple files with 100% local privacy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={progress.isSplitting}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Split Strategy Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Choose Split Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Action 1: Extract into 1 PDF */}
              <button
                type="button"
                onClick={() => setAction('extract-merged')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  action === 'extract-merged'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 text-indigo-950 font-bold text-sm mb-1">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Extract into 1 PDF</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Merges all selected pages into one new PDF document.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 mt-2 block">
                  Outputs 1 PDF file
                </span>
              </button>

              {/* Action 2: Extract into Separate PDFs */}
              <button
                type="button"
                onClick={() => setAction('extract-separate')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  action === 'extract-separate'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 text-indigo-950 font-bold text-sm mb-1">
                    <Archive className="w-4 h-4 text-indigo-600" />
                    <span>Separate Files (ZIP)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Extracts each selected page into its own individual PDF in a ZIP.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 mt-2 block">
                  Outputs ZIP archive
                </span>
              </button>

              {/* Action 3: Split Every N Pages */}
              <button
                type="button"
                onClick={() => setAction('split-every')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  action === 'split-every'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 text-indigo-950 font-bold text-sm mb-1">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Split by Fixed Chunks</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Splits the whole document into pieces of N pages each.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] font-semibold text-slate-600">Every:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={splitEveryN}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setSplitEveryN(isNaN(val) || val < 1 ? 1 : Math.min(val, totalPages));
                    }}
                    className="w-16 bg-white border border-slate-300 focus:border-indigo-600 rounded-lg px-2 py-0.5 text-xs font-bold text-indigo-700 text-center shadow-2xs"
                    title="Enter any number of pages without limits"
                  />
                  <span className="text-[11px] font-medium text-slate-500">Pages</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Engine Selector (Filtered vs Original) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Color & Quality Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setEngine('filtered')}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  engine === 'filtered'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="splitEngine"
                    checked={engine === 'filtered'}
                    onChange={() => setEngine('filtered')}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <div>
                    <p className="font-bold text-slate-900 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      Apply Studio Color Filters
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Renders extracted pages with your custom color filters and adjustments.
                    </p>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setEngine('original')}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  engine === 'original'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name="splitEngine"
                    checked={engine === 'original'}
                    onChange={() => setEngine('original')}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <div>
                    <p className="font-bold text-slate-900 flex items-center">
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      Original Vector Document
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Instant lossless split keeping original selectable text and vector graphics.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Page Selection Area (Hidden if split-every) */}
          {action !== 'split-every' ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Select Pages ({selectedPages.length} of {totalPages} selected)
                </label>

                {/* Quick Selection Pills */}
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={selectOdd}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Odd
                  </button>
                  <button
                    type="button"
                    onClick={selectEven}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Even
                  </button>
                  <button
                    type="button"
                    onClick={invertSelection}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Invert
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Range Input Field */}
              <div className="relative">
                <input
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  placeholder="e.g. 1-3, 5, 8-10"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-indigo-600 bg-slate-50 focus:bg-white"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 font-sans pointer-events-none">
                  Page Range
                </span>
              </div>

              {/* Visual Grid of Pages */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 max-h-56 sm:max-h-64 overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isSelected = selectedPages.includes(p);
                    const thumbUrl = thumbnails.get(p);

                    return (
                      <div
                        key={p}
                        onClick={() => togglePage(p)}
                        className={`group relative rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col items-center select-none ${
                          isSelected
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-full aspect-[1/1.41] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-100">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={`Page ${p}`}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">P. {p}</span>
                          )}

                          {/* Checkbox Icon */}
                          <div
                            className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'border border-slate-300 bg-white/80'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Page label */}
                        <span
                          className={`text-[10px] font-bold mt-1 ${
                            isSelected ? 'text-indigo-600' : 'text-slate-500'
                          }`}
                        >
                          Page {p}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Split Every N interactive configurator & preview */
            <div className="space-y-3">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center font-bold text-sm text-indigo-950">
                      <CheckCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Splitting into {pageGroups.length} Separate Files (ZIP)
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      The {totalPages}-page document will be divided into files of any custom chunk size without limits.
                    </p>
                  </div>

                  {/* Open number input */}
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-700">Split every:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={splitEveryN}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSplitEveryN(isNaN(val) || val < 1 ? 1 : Math.min(val, totalPages));
                      }}
                      className="w-16 font-bold text-sm text-indigo-700 text-center border-b border-indigo-300 focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-700">pages</span>
                  </div>
                </div>

                {/* Quick preset pills without limits */}
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 pt-1 border-t border-indigo-100">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Sizes:</span>
                  {[1, 2, 5, 10, 20, 50].filter(n => n <= totalPages).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitEveryN(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        splitEveryN === n
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {n} {n === 1 ? 'Page' : 'Pages'}
                    </button>
                  ))}
                  {totalPages > 2 && (
                    <button
                      type="button"
                      onClick={() => setSplitEveryN(Math.ceil(totalPages / 2))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        splitEveryN === Math.ceil(totalPages / 2)
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      Half ({Math.ceil(totalPages / 2)} Pgs)
                    </button>
                  )}
                </div>
              </div>

              {/* Live Breakdown Cards */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Generated Output Files ({pageGroups.length} Files):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {pageGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-0.5"
                    >
                      <span className="font-bold text-xs text-indigo-950 block">File #{idx + 1}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {group.length === 1
                          ? `Page ${group[0]}`
                          : `Pages ${group[0]} - ${group[group.length - 1]}`}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 block">
                        {group.length} {group.length === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80">
          <div className="text-xs text-slate-500">
            {action === 'extract-merged' && (
              <span>
                Creates <strong>1 merged PDF</strong> with <strong>{selectedPages.length}</strong> pages.
              </span>
            )}
            {action === 'extract-separate' && (
              <span>
                Creates <strong>{selectedPages.length} separate PDFs</strong> inside a ZIP archive.
              </span>
            )}
            {action === 'split-every' && (
              <span>
                Creates <strong>{pageGroups.length} separate PDFs</strong> inside a ZIP archive.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={progress.isSplitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteSplit}
              disabled={progress.isSplitting || pageGroups.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {progress.isSplitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Scissors className="w-3.5 h-3.5 mr-1.5" />
                  {action === 'extract-merged'
                    ? `Extract & Download (${selectedPages.length} Pages)`
                    : `Split & Download ZIP (${pageGroups.length} Files)`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Progress Overlay */}
        {progress.isSplitting && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-40 animate-in fade-in">
            <div className="max-w-sm w-full text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{progress.statusText}</h4>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600">{progress.percentage}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
