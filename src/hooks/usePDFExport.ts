import { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { ExportProgress, ExportQuality, PageDimensions, CompressionMode } from '../types/pdf';
import type { PageFilterConfig } from '../types/filters';
import { exportFilteredPDF, exportSinglePageImage } from '../lib/pdf/pdfExporter';
import * as pdfjs from 'pdfjs-dist';

export function usePDFExport() {
  const [progress, setProgress] = useState<ExportProgress>({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    statusText: '',
    isExporting: false,
    canCancel: true,
  });
  const [error, setError] = useState<string | null>(null);
  const cancelRequestedRef = useRef<boolean>(false);

  const triggerExport = useCallback(
    async (
      doc: pdfjs.PDFDocumentProxy,
      dimensions: PageDimensions[],
      pageConfigs: Map<number, PageFilterConfig>,
      defaultConfig: PageFilterConfig,
      quality: ExportQuality,
      fileName: string,
      compressionMode: CompressionMode = 'smart'
    ) => {
      cancelRequestedRef.current = false;
      setError(null);
      setProgress({
        currentPage: 0,
        totalPages: doc.numPages,
        percentage: 0,
        statusText: 'Preparing document export...',
        isExporting: true,
        canCancel: true,
      });

      try {
        await exportFilteredPDF({
          doc,
          dimensions,
          pageConfigs,
          defaultConfig,
          quality,
          compressionMode,
          fileName,
          onProgress: (p) => setProgress(p),
          shouldCancel: () => cancelRequestedRef.current,
        });

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // non-critical
        }
      } catch (err: unknown) {
        if (cancelRequestedRef.current) {
          setProgress((prev) => ({
            ...prev,
            isExporting: false,
            statusText: 'Export cancelled.',
          }));
        } else {
          const message = err instanceof Error ? err.message : 'Export failed.';
          setError(message);
          setProgress((prev) => ({
            ...prev,
            isExporting: false,
            statusText: 'Export encountered an error.',
          }));
        }
      } finally {
        setTimeout(() => {
          setProgress((prev) => ({ ...prev, isExporting: false }));
        }, 1500);
      }
    },
    []
  );

  const exportSingleImage = useCallback(
    async (
      doc: pdfjs.PDFDocumentProxy,
      pageNum: number,
      config: PageFilterConfig,
      format: 'png' | 'jpg',
      quality: ExportQuality,
      fileName: string
    ) => {
      try {
        await exportSinglePageImage(doc, pageNum, config, format, quality, fileName);
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch {}
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Image export failed.';
        setError(message);
      }
    },
    []
  );

  const cancelExport = useCallback(() => {
    cancelRequestedRef.current = true;
    setProgress((prev) => ({
      ...prev,
      statusText: 'Cancelling export...',
      canCancel: false,
    }));
  }, []);

  return {
    progress,
    exportError: error,
    triggerExport,
    exportSingleImage,
    cancelExport,
  };
}
