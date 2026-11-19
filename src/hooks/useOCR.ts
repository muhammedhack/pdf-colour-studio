import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type * as pdfjs from 'pdfjs-dist';
import type { OCRPageResult, OCRJobStatus, OCREngineMode, TTSState } from '../types/ocr';
import type { PageFilterConfig } from '../types/filters';
import type { PDFPageRenderer } from '../lib/pdf/pdfRenderer';
import { recognizePDFPage, terminateOCRWorker } from '../lib/ocr/ocrEngine';
import { ttsService } from '../lib/ocr/textToSpeech';
import {
  copyTextToClipboard,
  exportAllAsTxt,
  exportAllAsJSON,
  exportAllAsMarkdown,
  exportSearchablePDFReport,
  downloadFile,
} from '../lib/ocr/ocrExporter';

interface UseOCROptions {
  doc: pdfjs.PDFDocumentProxy | null;
  renderer: PDFPageRenderer | null;
  docName?: string;
}

export function useOCR({ doc, renderer, docName = 'document' }: UseOCROptions) {
  const [results, setResults] = useState<Map<number, OCRPageResult>>(new Map());
  const [selectedLang, setSelectedLang] = useState<string>('eng');
  const [selectedEngine, setSelectedEngine] = useState<OCREngineMode>('auto');
  const [enhanceImage, setEnhanceImage] = useState<boolean>(true);

  const [jobStatus, setJobStatus] = useState<OCRJobStatus>({
    isRunning: false,
    isPaused: false,
    currentPage: 0,
    totalPages: 0,
    progressPercent: 0,
    statusText: '',
    stage: 'idle',
    error: null,
    canCancel: true,
  });

  const [ttsState, setTtsState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentWordIndex: 0,
    rate: 1.0,
    pitch: 1.0,
  });
  const [activeSpokenWord, setActiveSpokenWord] = useState<string>('');

  const cancelRequestedRef = useRef<boolean>(false);
  const prevDocRef = useRef(doc);

  // Clean up workers and TTS on unmount
  useEffect(() => {
    return () => {
      terminateOCRWorker();
      ttsService.stop();
    };
  }, []);

  // When doc changes, reset results and stop TTS
  useEffect(() => {
    if (prevDocRef.current !== doc) {
      prevDocRef.current = doc;
      setResults(new Map());
      ttsService.stop();
      setTtsState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
      setActiveSpokenWord('');
    }
  }, [doc]);

  /**
   * Cancel ongoing recognition task
   */
  const cancelJob = useCallback(() => {
    cancelRequestedRef.current = true;
    setJobStatus((prev) => ({
      ...prev,
      isRunning: false,
      statusText: 'Cancelling recognition...',
      stage: 'idle',
    }));
  }, []);

  /**
   * Recognize a single page
   */
  const recognizePage = useCallback(
    async (pageNum: number, filterConfig?: PageFilterConfig) => {
      if (!doc || !renderer) return null;

      cancelRequestedRef.current = false;
      setJobStatus({
        isRunning: true,
        isPaused: false,
        currentPage: pageNum,
        totalPages: 1,
        progressPercent: 10,
        statusText: `Reading page ${pageNum}...`,
        stage: 'processing',
        error: null,
        canCancel: true,
      });

      try {
        const result = await recognizePDFPage({
          doc,
          pageNumber: pageNum,
          renderer,
          filterConfig,
          mode: selectedEngine,
          lang: selectedLang,
          enhanceImage,
          onProgress: (pct, msg) => {
            setJobStatus((prev) => ({
              ...prev,
              progressPercent: Math.round(pct * 100),
              statusText: msg,
            }));
          },
          shouldCancel: () => cancelRequestedRef.current,
        });

        setResults((prev) => {
          const next = new Map(prev);
          next.set(pageNum, result);
          return next;
        });

        setJobStatus({
          isRunning: false,
          isPaused: false,
          currentPage: pageNum,
          totalPages: 1,
          progressPercent: 100,
          statusText: 'Recognition completed!',
          stage: 'completed',
          error: null,
          canCancel: false,
        });

        return result;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Recognition failed';
        if (cancelRequestedRef.current) {
          setJobStatus((prev) => ({
            ...prev,
            isRunning: false,
            statusText: 'Recognition stopped',
            stage: 'idle',
          }));
        } else {
          setJobStatus((prev) => ({
            ...prev,
            isRunning: false,
            statusText: 'Error during recognition',
            stage: 'error',
            error: errorMsg,
          }));
        }
        return null;
      }
    },
    [doc, renderer, selectedEngine, selectedLang, enhanceImage]
  );

  /**
   * Batch Recognize all pages in the PDF
   */
  const recognizeAllPages = useCallback(
    async (
      totalPages: number,
      getPageConfig: (pageNum: number) => PageFilterConfig
    ) => {
      if (!doc || !renderer || totalPages === 0) return;

      cancelRequestedRef.current = false;
      setJobStatus({
        isRunning: true,
        isPaused: false,
        currentPage: 1,
        totalPages,
        progressPercent: 5,
        statusText: `Starting batch OCR (1 of ${totalPages})...`,
        stage: 'processing',
        error: null,
        canCancel: true,
      });

      for (let p = 1; p <= totalPages; p++) {
        if (cancelRequestedRef.current) {
          break;
        }

        const config = getPageConfig(p);
        const overallBase = ((p - 1) / totalPages) * 100;
        const pageWeight = (1 / totalPages) * 100;

        setJobStatus((prev) => ({
          ...prev,
          currentPage: p,
          statusText: `Recognizing page ${p} of ${totalPages}...`,
          progressPercent: Math.round(overallBase),
        }));

        try {
          const result = await recognizePDFPage({
            doc,
            pageNumber: p,
            renderer,
            filterConfig: config,
            mode: selectedEngine,
            lang: selectedLang,
            enhanceImage,
            onProgress: (pct, msg) => {
              setJobStatus((prev) => ({
                ...prev,
                progressPercent: Math.round(overallBase + pct * pageWeight),
                statusText: `Page ${p}/${totalPages}: ${msg}`,
              }));
            },
            shouldCancel: () => cancelRequestedRef.current,
          });

          setResults((prev) => {
            const next = new Map(prev);
            next.set(p, result);
            return next;
          });
        } catch (err: unknown) {
          if (cancelRequestedRef.current) {
            break;
          }
          console.error(`Error recognizing page ${p}:`, err);
        }
      }

      if (cancelRequestedRef.current) {
        setJobStatus((prev) => ({
          ...prev,
          isRunning: false,
          statusText: 'Batch recognition cancelled',
          stage: 'idle',
        }));
      } else {
        setJobStatus({
          isRunning: false,
          isPaused: false,
          currentPage: totalPages,
          totalPages,
          progressPercent: 100,
          statusText: `Successfully recognized all ${totalPages} pages!`,
          stage: 'completed',
          error: null,
          canCancel: false,
        });
      }
    },
    [doc, renderer, selectedEngine, selectedLang, enhanceImage]
  );

  /**
   * Audio Text-To-Speech Controls
   */
  const playTTS = useCallback(
    (textToSpeak: string) => {
      if (!textToSpeak.trim()) return;

      ttsService.speak(
        textToSpeak,
        {
          rate: ttsState.rate,
          pitch: ttsState.pitch,
          lang: selectedLang,
        },
        {
          onStart: () => {
            setTtsState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
          },
          onEnd: () => {
            setTtsState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
            setActiveSpokenWord('');
          },
          onError: () => {
            setTtsState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
            setActiveSpokenWord('');
          },
          onWordBoundary: (word, index) => {
            setActiveSpokenWord(word);
            setTtsState((prev) => ({ ...prev, currentWordIndex: index }));
          },
        }
      );
    },
    [ttsState.rate, ttsState.pitch, selectedLang]
  );

  const pauseTTS = useCallback(() => {
    ttsService.pause();
    setTtsState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  }, []);

  const resumeTTS = useCallback(() => {
    ttsService.resume();
    setTtsState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const stopTTS = useCallback(() => {
    ttsService.stop();
    setTtsState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    setActiveSpokenWord('');
  }, []);

  const setTTSRate = useCallback((newRate: number) => {
    setTtsState((prev) => ({ ...prev, rate: newRate }));
  }, []);

  /**
   * Export Utilities
   */
  const copyCurrentPageText = useCallback(async (pageNum: number): Promise<boolean> => {
    const res = results.get(pageNum);
    if (!res || !res.text) return false;
    return copyTextToClipboard(res.text);
  }, [results]);

  const copyAllPagesText = useCallback(async (): Promise<boolean> => {
    const sortedPages = Array.from(results.keys()).sort((a, b) => a - b);
    const combined = sortedPages
      .map((p) => {
        const item = results.get(p);
        return item ? `--- Page ${p} ---\n${item.text}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    if (!combined) return false;
    return copyTextToClipboard(combined);
  }, [results]);

  const downloadCurrentPageTxt = useCallback((pageNum: number) => {
    const res = results.get(pageNum);
    if (!res) return;
    const cleanName = docName.replace(/\.[^/.]+$/, '');
    downloadFile(`${cleanName}_page_${pageNum}_text.txt`, res.text);
  }, [results, docName]);

  const downloadAllTxt = useCallback(() => {
    exportAllAsTxt(results, docName);
  }, [results, docName]);

  const downloadAllJSON = useCallback(() => {
    exportAllAsJSON(results, docName);
  }, [results, docName]);

  const downloadAllMarkdown = useCallback(() => {
    exportAllAsMarkdown(results, docName);
  }, [results, docName]);

  const downloadPDFReport = useCallback(() => {
    exportSearchablePDFReport(results, docName);
  }, [results, docName]);

  const clearResults = useCallback(() => {
    setResults(new Map());
    stopTTS();
  }, [stopTTS]);

  const totalRecognizedCount = useMemo(() => results.size, [results]);

  return {
    results,
    jobStatus,
    selectedLang,
    selectedEngine,
    enhanceImage,
    ttsState,
    activeSpokenWord,
    totalRecognizedCount,
    setSelectedLang,
    setSelectedEngine,
    setEnhanceImage,
    recognizePage,
    recognizeAllPages,
    cancelJob,
    clearResults,
    playTTS,
    pauseTTS,
    resumeTTS,
    stopTTS,
    setTTSRate,
    copyCurrentPageText,
    copyAllPagesText,
    downloadCurrentPageTxt,
    downloadAllTxt,
    downloadAllJSON,
    downloadAllMarkdown,
    downloadPDFReport,
  };
}
