import React, { useState } from 'react';
import type { LoadedPDF } from '../lib/pdf/pdfLoader';
import { PDFPageRenderer } from '../lib/pdf/pdfRenderer';
import { usePDFFilters } from '../hooks/usePDFFilters';
import { usePDFExport } from '../hooks/usePDFExport';
import { PageThumbnails } from './PageThumbnails';
import { PDFViewer } from './PDFViewer';
import { FilterPanel } from './FilterPanel';
import { AdjustmentSliders } from './AdjustmentSliders';
import { ExportPanel } from './ExportPanel';
import { ProgressIndicator } from './ProgressIndicator';
import { SplitModal } from './SplitModal';
import { OCRPanel } from './OCRPanel';
import { useOCR } from '../hooks/useOCR';
import type { ExportQuality, CompressionMode } from '../types/pdf';
import {
  Sparkles,
  Sliders,
  Download,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  Scissors,
  Brain,
} from 'lucide-react';

interface PDFWorkspaceProps {
  loadedPDF: LoadedPDF;
  renderer: PDFPageRenderer;
  onOpenNew: () => void;
}

type TabType = 'filters' | 'adjust' | 'ocr' | 'pages' | 'export';

export const PDFWorkspace: React.FC<PDFWorkspaceProps> = ({
  loadedPDF,
  renderer,
}) => {
  const { doc, info, dimensions } = loadedPDF;
  const totalPages = doc.numPages;

  const {
    currentPage,
    setCurrentPage,
    targetMode,
    setTargetMode,
    activeConfig,
    pageConfigs,
    getPageConfig,
    isPageCustomized,
    applyPreset,
    updateAdjustment,
    resetCurrentPage,
    resetAllPages,
    applyCurrentToAll,
  } = usePDFFilters();

  const { progress, exportError, triggerExport, exportSingleImage, cancelExport } = usePDFExport();

  const {
    results: ocrResults,
    jobStatus: ocrJobStatus,
    selectedLang: ocrSelectedLang,
    selectedEngine: ocrSelectedEngine,
    enhanceImage: ocrEnhanceImage,
    ttsState: ocrTtsState,
    activeSpokenWord: ocrActiveSpokenWord,
    setSelectedLang: setOcrSelectedLang,
    setSelectedEngine: setOcrSelectedEngine,
    setEnhanceImage: setOcrEnhanceImage,
    recognizePage: recognizeOcrPage,
    recognizeAllPages: recognizeOcrAllPages,
    cancelJob: cancelOcrJob,
    playTTS: playOcrTTS,
    pauseTTS: pauseOcrTTS,
    resumeTTS: resumeOcrTTS,
    stopTTS: stopOcrTTS,
    setTTSRate: setOcrTTSRate,
    copyCurrentPageText: copyOcrCurrentPageText,
    copyAllPagesText: copyOcrAllPagesText,
    downloadCurrentPageTxt: downloadOcrCurrentPageTxt,
    downloadAllTxt: downloadOcrAllTxt,
    downloadAllJSON: downloadOcrAllJSON,
    downloadAllMarkdown: downloadOcrAllMarkdown,
    downloadPDFReport: downloadOcrPDFReport,
  } = useOCR({
    doc,
    renderer,
    docName: info.name,
  });

  const [activeTab, setActiveTab] = useState<TabType>('filters');
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(true);
  const [isMobileSheetCollapsed, setIsMobileSheetCollapsed] = useState<boolean>(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);

  const handleExportPDF = (quality: ExportQuality, compressionMode: CompressionMode) => {
    triggerExport(
      doc,
      dimensions,
      pageConfigs,
      getPageConfig(currentPage),
      quality,
      info.name,
      compressionMode
    );
  };

  const handleExportImage = (format: 'png' | 'jpg', quality: ExportQuality) => {
    exportSingleImage(
      doc,
      currentPage,
      getPageConfig(currentPage),
      format,
      quality,
      info.name
    );
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-slate-100">
      {/* Workspace Sub-header */}
      <div className="bg-white border-b border-slate-200/80 px-3 sm:px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setIsThumbnailsOpen((prev) => !prev)}
            className="hidden md:inline-flex items-center text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
            title="Toggle Page Thumbnails Panel"
          >
            {isThumbnailsOpen ? (
              <PanelLeftClose className="w-4 h-4 mr-1.5" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 mr-1.5" />
            )}
            <span className="font-medium">Thumbnails</span>
          </button>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-xs">
              {info.name}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
          </div>
        </div>

        {/* Right sub-header actions: Split PDF & custom badge */}
        <div className="flex items-center space-x-2">
          {/* Prominent Split PDF Trigger */}
          <button
            type="button"
            onClick={() => setIsSplitModalOpen(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
            title="Split or Extract PDF Pages"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-600" />
            <span>Split PDF</span>
          </button>

          {pageConfigs.size > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
              {pageConfigs.size} {pageConfigs.size === 1 ? 'page' : 'pages'} custom
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 font-medium text-[11px] hidden sm:inline-block">
              Filter applies to all pages
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP LAYOUT (>= md): 3-Column Studio                  */}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        {/* LEFT PANEL: Page Thumbnails */}
        <div
          className={`transition-all duration-200 flex-shrink-0 ${
            isThumbnailsOpen ? 'w-56 lg:w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <PageThumbnails
            doc={doc}
            currentPage={currentPage}
            totalPages={totalPages}
            onSelectPage={setCurrentPage}
            getPageConfig={getPageConfig}
            isPageCustomized={isPageCustomized}
            onApplyToAll={applyCurrentToAll}
            onResetAll={resetAllPages}
            onResetCurrent={resetCurrentPage}
          />
        </div>

        {/* CENTER PANEL: Large PDF Canvas Preview */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <PDFViewer
            renderer={renderer}
            currentPage={currentPage}
            totalPages={totalPages}
            filterConfig={activeConfig}
            onPageChange={setCurrentPage}
            onResetPage={resetCurrentPage}
            onOpenOCR={() => {
              setActiveTab('ocr');
              setIsMobileSheetCollapsed(false);
            }}
            isOCRActive={activeTab === 'ocr'}
            hasOCRResult={ocrResults.has(currentPage)}
          />
        </div>

        {/* RIGHT PANEL: Controls, Filters & Export */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-white border-l border-slate-200/80 flex flex-col h-full z-20">
          {/* Desktop Right Panel Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-200/80 p-1.5 gap-1 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`flex items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'filters'
                  ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('adjust')}
              className={`flex items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'adjust'
                  ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 mr-1 text-blue-600 flex-shrink-0" />
              <span className="truncate">Adjust</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'ocr'
                  ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5 mr-1 text-purple-600 flex-shrink-0" />
              <span className="truncate">OCR & Read</span>
              {ocrResults.has(currentPage) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex items-center justify-center py-2 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Export</span>
            </button>
          </div>

          {/* Desktop Panel Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'filters' && (
              <FilterPanel
                selectedPresetId={activeConfig.presetId}
                onSelectPreset={applyPreset}
              />
            )}

            {activeTab === 'adjust' && (
              <AdjustmentSliders
                adjustments={activeConfig.adjustments}
                activePresetId={activeConfig.presetId}
                onChange={updateAdjustment}
                onReset={resetCurrentPage}
              />
            )}

            {activeTab === 'ocr' && (
              <OCRPanel
                currentPage={currentPage}
                totalPages={totalPages}
                currentResult={ocrResults.get(currentPage)}
                allResults={ocrResults}
                jobStatus={ocrJobStatus}
                selectedLang={ocrSelectedLang}
                selectedEngine={ocrSelectedEngine}
                enhanceImage={ocrEnhanceImage}
                ttsState={ocrTtsState}
                activeSpokenWord={ocrActiveSpokenWord}
                activeFilterConfig={activeConfig}
                onSelectLang={setOcrSelectedLang}
                onSelectEngine={setOcrSelectedEngine}
                onToggleEnhanceImage={setOcrEnhanceImage}
                onRecognizeCurrentPage={() => recognizeOcrPage(currentPage, activeConfig)}
                onRecognizeAllPages={() => recognizeOcrAllPages(totalPages, getPageConfig)}
                onCancelJob={cancelOcrJob}
                onPlayTTS={playOcrTTS}
                onPauseTTS={pauseOcrTTS}
                onResumeTTS={resumeOcrTTS}
                onStopTTS={stopOcrTTS}
                onSetTTSRate={setOcrTTSRate}
                onCopyCurrentPage={() => copyOcrCurrentPageText(currentPage)}
                onCopyAllPages={copyOcrAllPagesText}
                onDownloadCurrentTxt={() => downloadOcrCurrentPageTxt(currentPage)}
                onDownloadAllTxt={downloadOcrAllTxt}
                onDownloadAllJSON={downloadOcrAllJSON}
                onDownloadAllMarkdown={downloadOcrAllMarkdown}
                onDownloadPDFReport={downloadOcrPDFReport}
              />
            )}

            {activeTab === 'export' && (
              <ExportPanel
                currentPage={currentPage}
                totalPages={totalPages}
                targetMode={targetMode}
                onTargetModeChange={setTargetMode}
                onExportPDF={handleExportPDF}
                onExportImage={handleExportImage}
                onOpenSplit={() => setIsSplitModalOpen(true)}
                isExporting={progress.isExporting}
              />
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE SPLIT STUDIO LAYOUT (< md) - ZERO LAG, LIVE VIEW  */}
      {/* Top: Live Preview | Bottom: Touch-Optimized Tools Sheet  */}
      {/* ======================================================== */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden relative">
        {/* TOP: Live PDF Preview */}
        <div
          className={`transition-all duration-200 min-w-0 ${
            isMobileSheetCollapsed ? 'h-[calc(100%-3rem)]' : 'h-[44%]'
          }`}
        >
          <PDFViewer
            renderer={renderer}
            currentPage={currentPage}
            totalPages={totalPages}
            filterConfig={activeConfig}
            onPageChange={setCurrentPage}
            onResetPage={resetCurrentPage}
            onOpenOCR={() => {
              setActiveTab('ocr');
              setIsMobileSheetCollapsed(false);
            }}
            isOCRActive={activeTab === 'ocr'}
            hasOCRResult={ocrResults.has(currentPage)}
          />
        </div>

        {/* BOTTOM: Mobile Tool Drawer with Tabs */}
        <div
          className={`bg-white border-t border-slate-200/90 shadow-lg flex flex-col transition-all duration-200 z-30 ${
            isMobileSheetCollapsed ? 'h-12' : 'h-[56%]'
          }`}
        >
          {/* Mobile Sheet Header / Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-2 py-1.5">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none flex-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('filters');
                  setIsMobileSheetCollapsed(false);
                }}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'filters' && !isMobileSheetCollapsed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Filters
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('adjust');
                  setIsMobileSheetCollapsed(false);
                }}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'adjust' && !isMobileSheetCollapsed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 mr-1" />
                Adjust
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('ocr');
                  setIsMobileSheetCollapsed(false);
                }}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors relative ${
                  activeTab === 'ocr' && !isMobileSheetCollapsed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 mr-1 text-purple-400" />
                OCR & Read
                {ocrResults.has(currentPage) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pages');
                  setIsMobileSheetCollapsed(false);
                }}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'pages' && !isMobileSheetCollapsed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 mr-1" />
                Pages ({totalPages})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('export');
                  setIsMobileSheetCollapsed(false);
                }}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'export' && !isMobileSheetCollapsed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export
              </button>

              <button
                type="button"
                onClick={() => setIsSplitModalOpen(true)}
                className="flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 whitespace-nowrap transition-colors"
              >
                <Scissors className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Split
              </button>
            </div>

            {/* Collapse / Expand Tool Sheet Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSheetCollapsed((prev) => !prev)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 ml-1 transition-colors"
              title={isMobileSheetCollapsed ? 'Open tools' : 'Minimize tools'}
            >
              {isMobileSheetCollapsed ? (
                <ChevronUp className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          {/* Mobile Sheet Content Area */}
          {!isMobileSheetCollapsed && (
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'filters' && (
                <FilterPanel
                  selectedPresetId={activeConfig.presetId}
                  onSelectPreset={applyPreset}
                />
              )}

              {activeTab === 'adjust' && (
                <AdjustmentSliders
                  adjustments={activeConfig.adjustments}
                  activePresetId={activeConfig.presetId}
                  onChange={updateAdjustment}
                  onReset={resetCurrentPage}
                />
              )}

              {activeTab === 'ocr' && (
                <OCRPanel
                  currentPage={currentPage}
                  totalPages={totalPages}
                  currentResult={ocrResults.get(currentPage)}
                  allResults={ocrResults}
                  jobStatus={ocrJobStatus}
                  selectedLang={ocrSelectedLang}
                  selectedEngine={ocrSelectedEngine}
                  enhanceImage={ocrEnhanceImage}
                  ttsState={ocrTtsState}
                  activeSpokenWord={ocrActiveSpokenWord}
                  activeFilterConfig={activeConfig}
                  onSelectLang={setOcrSelectedLang}
                  onSelectEngine={setOcrSelectedEngine}
                  onToggleEnhanceImage={setOcrEnhanceImage}
                  onRecognizeCurrentPage={() => recognizeOcrPage(currentPage, activeConfig)}
                  onRecognizeAllPages={() => recognizeOcrAllPages(totalPages, getPageConfig)}
                  onCancelJob={cancelOcrJob}
                  onPlayTTS={playOcrTTS}
                  onPauseTTS={pauseOcrTTS}
                  onResumeTTS={resumeOcrTTS}
                  onStopTTS={stopOcrTTS}
                  onSetTTSRate={setOcrTTSRate}
                  onCopyCurrentPage={() => copyOcrCurrentPageText(currentPage)}
                  onCopyAllPages={copyOcrAllPagesText}
                  onDownloadCurrentTxt={() => downloadOcrCurrentPageTxt(currentPage)}
                  onDownloadAllTxt={downloadOcrAllTxt}
                  onDownloadAllJSON={downloadOcrAllJSON}
                  onDownloadAllMarkdown={downloadOcrAllMarkdown}
                  onDownloadPDFReport={downloadOcrPDFReport}
                />
              )}

              {activeTab === 'pages' && (
                <div className="h-full">
                  <PageThumbnails
                    doc={doc}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onSelectPage={setCurrentPage}
                    getPageConfig={getPageConfig}
                    isPageCustomized={isPageCustomized}
                    onApplyToAll={applyCurrentToAll}
                    onResetAll={resetAllPages}
                    onResetCurrent={resetCurrentPage}
                  />
                </div>
              )}

              {activeTab === 'export' && (
                <ExportPanel
                  currentPage={currentPage}
                  totalPages={totalPages}
                  targetMode={targetMode}
                  onTargetModeChange={setTargetMode}
                  onExportPDF={handleExportPDF}
                  onExportImage={handleExportImage}
                  onOpenSplit={() => setIsSplitModalOpen(true)}
                  isExporting={progress.isExporting}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Split & Extract Modal */}
      <SplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        doc={doc}
        dimensions={dimensions}
        pageConfigs={pageConfigs}
        defaultConfig={getPageConfig(currentPage)}
        arrayBuffer={loadedPDF.arrayBuffer}
        fileName={info.name}
      />

      {/* Export Progress Modal */}
      <ProgressIndicator progress={progress} onCancel={cancelExport} />

      {/* Error alert toast */}
      {exportError && (
        <div className="fixed bottom-16 right-4 z-50 p-4 rounded-xl bg-rose-600 text-white text-xs shadow-xl animate-in fade-in">
          <p className="font-bold">Export Error</p>
          <p>{exportError}</p>
        </div>
      )}
    </div>
  );
};
