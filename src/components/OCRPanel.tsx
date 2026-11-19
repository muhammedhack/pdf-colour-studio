import React, { useState, useMemo } from 'react';
import type { OCRPageResult, OCRJobStatus, OCREngineMode, TTSState } from '../types/ocr';
import type { PageFilterConfig } from '../types/filters';
import { OCR_LANGUAGES } from '../lib/ocr/ocrConstants';
import {
  Sparkles,
  Play,
  Pause,
  Square,
  Volume2,
  Copy,
  Check,
  Download,
  Search,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Brain,
  Sliders,
  X,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

interface OCRPanelProps {
  currentPage: number;
  totalPages: number;
  currentResult: OCRPageResult | undefined;
  allResults: Map<number, OCRPageResult>;
  jobStatus: OCRJobStatus;
  selectedLang: string;
  selectedEngine: OCREngineMode;
  enhanceImage: boolean;
  ttsState: TTSState;
  activeSpokenWord: string;
  activeFilterConfig?: PageFilterConfig;
  onSelectLang: (lang: string) => void;
  onSelectEngine: (engine: OCREngineMode) => void;
  onToggleEnhanceImage: (enhance: boolean) => void;
  onRecognizeCurrentPage: () => void;
  onRecognizeAllPages: () => void;
  onCancelJob: () => void;
  onPlayTTS: (text: string) => void;
  onPauseTTS: () => void;
  onResumeTTS: () => void;
  onStopTTS: () => void;
  onSetTTSRate: (rate: number) => void;
  onCopyCurrentPage: () => Promise<boolean>;
  onCopyAllPages: () => Promise<boolean>;
  onDownloadCurrentTxt: () => void;
  onDownloadAllTxt: () => void;
  onDownloadAllJSON: () => void;
  onDownloadAllMarkdown: () => void;
  onDownloadPDFReport: () => void;
}

export const OCRPanel: React.FC<OCRPanelProps> = ({
  currentPage,
  totalPages,
  currentResult,
  allResults,
  jobStatus,
  selectedLang,
  selectedEngine,
  enhanceImage,
  ttsState,
  activeSpokenWord,
  activeFilterConfig,
  onSelectLang,
  onSelectEngine,
  onToggleEnhanceImage,
  onRecognizeCurrentPage,
  onRecognizeAllPages,
  onCancelJob,
  onPlayTTS,
  onPauseTTS,
  onResumeTTS,
  onStopTTS,
  onSetTTSRate,
  onCopyCurrentPage,
  onCopyAllPages,
  onDownloadCurrentTxt,
  onDownloadAllTxt,
  onDownloadAllJSON,
  onDownloadAllMarkdown,
  onDownloadPDFReport,
}) => {
  const [copySuccessPage, setCopySuccessPage] = useState(false);
  const [copySuccessAll, setCopySuccessAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'text' | 'lines'>('text');

  const hasCurrentResult = !!currentResult && currentResult.text.trim().length > 0;
  const totalScannedCount = allResults.size;

  const handleCopyCurrent = async () => {
    const ok = await onCopyCurrentPage();
    if (ok) {
      setCopySuccessPage(true);
      setTimeout(() => setCopySuccessPage(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    const ok = await onCopyAllPages();
    if (ok) {
      setCopySuccessAll(true);
      setTimeout(() => setCopySuccessAll(false), 2000);
    }
  };

  // Filter or highlight text
  const highlightedContent = useMemo(() => {
    if (!currentResult || !currentResult.text) return null;
    const text = currentResult.text;
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 text-amber-950 font-semibold rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [currentResult, searchQuery]);

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {/* 1. OCR Configuration Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              OCR & Reading Engine
            </span>
          </div>
          {totalScannedCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalScannedCount}/{totalPages} Scanned
            </span>
          )}
        </div>

        {/* Engine Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onSelectEngine('auto')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              selectedEngine === 'auto'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Auto-detect: uses instant vector text if digital, or deep AI OCR if scanned"
          >
            <Zap className="w-3 h-3 mr-1 text-amber-500" />
            Auto
          </button>

          <button
            type="button"
            onClick={() => onSelectEngine('ocr')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              selectedEngine === 'ocr'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Force deep AI optical character recognition using Tesseract WebAssembly"
          >
            <Brain className="w-3 h-3 mr-1 text-indigo-600" />
            AI OCR
          </button>

          <button
            type="button"
            onClick={() => onSelectEngine('native')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              selectedEngine === 'native'
                ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Fast direct extraction from digital PDF text layer"
          >
            <FileText className="w-3 h-3 mr-1 text-emerald-600" />
            Native
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
            <span>OCR Language</span>
            <span className="text-[10px] text-slate-400">Tesseract WASM</span>
          </label>
          <select
            value={selectedLang}
            onChange={(e) => onSelectLang(e.target.value)}
            disabled={jobStatus.isRunning}
            className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {OCR_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} {l.nativeName && l.nativeName !== l.name ? `(${l.nativeName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Image enhancement toggle */}
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer pt-0.5">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium">Pre-process with studio filters</span>
          </div>
          <input
            type="checkbox"
            checked={enhanceImage}
            onChange={(e) => onToggleEnhanceImage(e.target.checked)}
            disabled={jobStatus.isRunning}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>
        {enhanceImage && activeFilterConfig && activeFilterConfig.presetId !== 'original' && (
          <p className="text-[10px] text-indigo-600 bg-indigo-50/70 px-2 py-1 rounded border border-indigo-100">
            Applying <strong>{activeFilterConfig.presetId}</strong> filter enhancement before scanning for sharper contrast.
          </p>
        )}
      </div>

      {/* 2. Action Trigger Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRecognizeCurrentPage}
          disabled={jobStatus.isRunning}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          {jobStatus.isRunning && jobStatus.totalPages === 1 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Scan Page {currentPage}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onRecognizeAllPages}
          disabled={jobStatus.isRunning}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          {jobStatus.isRunning && jobStatus.totalPages > 1 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning All...</span>
            </>
          ) : (
            <>
              <Brain className="w-3.5 h-3.5" />
              <span>Scan All ({totalPages})</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Real-time Progress Bar & Status */}
      {jobStatus.isRunning && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
            <span className="flex items-center space-x-1.5 truncate">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin flex-shrink-0" />
              <span className="truncate">{jobStatus.statusText}</span>
            </span>
            <span className="font-mono text-indigo-700 ml-2">{jobStatus.progressPercent}%</span>
          </div>

          <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${jobStatus.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onCancelJob}
              className="text-[11px] font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {jobStatus.error && !jobStatus.isRunning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Recognition Error</p>
            <p className="text-[11px] text-red-600 mt-0.5">{jobStatus.error}</p>
          </div>
        </div>
      )}

      {/* 4. Audio Reader & TTS Controls */}
      {hasCurrentResult && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-indigo-900">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold">Audio Reader (Listen Aloud)</span>
            </div>

            {/* Speaking animation indicator */}
            {ttsState.isPlaying && (
              <span className="flex items-center space-x-1 text-[11px] font-medium text-indigo-600">
                <span className="inline-block w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                <span>Reading...</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Play / Pause / Stop Buttons */}
            <div className="flex items-center space-x-1.5">
              {!ttsState.isPlaying ? (
                <button
                  type="button"
                  onClick={() => {
                    if (ttsState.isPaused) {
                      onResumeTTS();
                    } else {
                      onPlayTTS(currentResult.text);
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{ttsState.isPaused ? 'Resume' : 'Play'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPauseTTS}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={onStopTTS}
                disabled={!ttsState.isPlaying && !ttsState.isPaused}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 disabled:opacity-40 transition-colors cursor-pointer"
                title="Stop Reading"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Playback Speed selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Speed:</span>
              {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onSetTTSRate(speed)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    ttsState.rate === speed
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {activeSpokenWord && (
            <div className="text-[11px] text-indigo-700 bg-white/80 px-2 py-1 rounded border border-indigo-100 truncate">
              Speaking word: <strong className="font-semibold text-indigo-900">{activeSpokenWord}</strong>
            </div>
          )}
        </div>
      )}

      {/* 5. Results Area */}
      {hasCurrentResult ? (
        <div className="space-y-3">
          {/* Metadata & Stats Pills */}
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border ${
                currentResult.source === 'native'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {currentResult.source === 'native' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Native Vector (100%)
                </>
              ) : (
                <>
                  <Brain className="w-3 h-3 mr-1" />
                  AI OCR ({currentResult.confidence}% Conf)
                </>
              )}
            </span>

            <div className="flex items-center space-x-2 text-slate-500 font-medium">
              <span>{currentResult.wordCount} words</span>
              <span>•</span>
              <span>{currentResult.charCount} chars</span>
              <span>•</span>
              <span>{currentResult.durationMs}ms</span>
            </div>
          </div>

          {/* Quick Search & Filter in extracted text */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Find inside extracted text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Formatted text vs Line-by-line breakdown */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-100">
              <button
                type="button"
                onClick={() => setActiveViewTab('text')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer ${
                  activeViewTab === 'text' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Document Text
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('lines')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer ${
                  activeViewTab === 'lines' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Lines ({currentResult.lineCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyCurrent}
              className="flex items-center space-x-1 text-slate-600 hover:text-indigo-600 text-xs font-semibold cursor-pointer"
            >
              {copySuccessPage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Page</span>
                </>
              )}
            </button>
          </div>

          {/* Text Output Box */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 max-h-64 overflow-y-auto text-xs font-mono leading-relaxed select-text border border-slate-800 shadow-inner">
            {activeViewTab === 'text' ? (
              <div className="whitespace-pre-wrap">{highlightedContent}</div>
            ) : (
              <div className="space-y-1">
                {(currentResult.lines || []).map((line, idx) => (
                  <div key={idx} className="flex items-baseline space-x-2 border-b border-slate-800/80 pb-1">
                    <span className="text-[10px] text-slate-500 font-mono select-none w-5 text-right flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-slate-200">{line.text}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{line.confidence}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Export Recognized Text
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onDownloadCurrentTxt}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Page {currentPage} .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copySuccessAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Copy All Pages</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDownloadAllTxt}
                disabled={totalScannedCount === 0}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>All Pages .TXT</span>
              </button>

              <button
                type="button"
                onClick={onDownloadAllMarkdown}
                disabled={totalScannedCount === 0}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-violet-600" />
                <span>Markdown (.MD)</span>
              </button>

              <button
                type="button"
                onClick={onDownloadAllJSON}
                disabled={totalScannedCount === 0}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>JSON Data</span>
              </button>

              <button
                type="button"
                onClick={onDownloadPDFReport}
                disabled={totalScannedCount === 0}
                className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Page {currentPage} Not Scanned Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Extract embedded text or run deep optical character recognition to read, search, copy, and listen to this page.
            </p>
          </div>
          <button
            type="button"
            onClick={onRecognizeCurrentPage}
            disabled={jobStatus.isRunning}
            className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Scan Page {currentPage} Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
