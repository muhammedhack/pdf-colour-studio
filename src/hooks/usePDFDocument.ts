import { useState, useCallback, useRef } from 'react';
import type { LoadedPDF } from '../lib/pdf/pdfLoader';
import { loadPDFDocument } from '../lib/pdf/pdfLoader';
import { generateSamplePDF } from '../lib/pdf/samplePdf';
import { PDFPageRenderer } from '../lib/pdf/pdfRenderer';

export function usePDFDocument() {
  const [loadedPDF, setLoadedPDF] = useState<LoadedPDF | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const rendererRef = useRef<PDFPageRenderer | null>(null);

  const resetDocument = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.clearCache();
      rendererRef.current = null;
    }
    if (loadedPDF?.doc) {
      loadedPDF.doc.cleanup();
    }
    setLoadedPDF(null);
    setError(null);
    setIsLoading(false);
  }, [loadedPDF]);

  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (rendererRef.current) {
        rendererRef.current.clearCache();
        rendererRef.current = null;
      }

      const result = await loadPDFDocument(file, file.name);
      rendererRef.current = new PDFPageRenderer(result.doc);
      setLoadedPDF(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load PDF file.';
      setError(message);
      setLoadedPDF(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSample = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (rendererRef.current) {
        rendererRef.current.clearCache();
        rendererRef.current = null;
      }

      const sampleBuffer = generateSamplePDF();
      const result = await loadPDFDocument(sampleBuffer, 'PDF_Color_Studio_Showcase.pdf');
      rendererRef.current = new PDFPageRenderer(result.doc);
      setLoadedPDF(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sample PDF.';
      setError(message);
      setLoadedPDF(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    loadedPDF,
    isLoading,
    error,
    renderer: rendererRef.current,
    loadFile,
    loadSample,
    resetDocument,
    setError,
  };
}
