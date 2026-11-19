import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import type { OCRPageResult, OCRLine, OCRWord, OCREngineMode } from '../../types/ocr';
import type { PageFilterConfig } from '../../types/filters';
import { PDFPageRenderer } from '../pdf/pdfRenderer';
import { createFilteredCanvas } from '../filters/canvasFilters';

// Cached Tesseract worker instance and active language
let activeWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
let activeWorkerLang: string | null = null;
let workerInitializingPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

/**
 * Gets or initializes a reusable Tesseract worker for the specified language
 */
export async function getTesseractWorker(
  lang: string,
  onProgress?: (progress: number, status: string) => void
): Promise<Awaited<ReturnType<typeof createWorker>>> {
  // If active worker already exists for this exact language, reuse it
  if (activeWorker && activeWorkerLang === lang) {
    return activeWorker;
  }

  // If another call is currently initializing the worker, await it
  if (workerInitializingPromise) {
    const worker = await workerInitializingPromise;
    if (activeWorkerLang === lang) {
      return worker;
    }
  }

  // Terminate previous worker if language changed
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {
      // ignore termination error
    }
    activeWorker = null;
    activeWorkerLang = null;
  }

  workerInitializingPromise = (async () => {
    onProgress?.(0.05, `Initializing ${lang.toUpperCase()} OCR engine...`);
    const worker = await createWorker(lang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.(0.1 + (m.progress || 0) * 0.9, `Recognizing text (${Math.round((m.progress || 0) * 100)}%)...`);
        } else if (m.status) {
          onProgress?.(0.05, `Loading OCR models (${m.status})...`);
        }
      },
    });

    activeWorker = worker;
    activeWorkerLang = lang;
    workerInitializingPromise = null;
    return worker;
  })();

  return workerInitializingPromise;
}

/**
 * Terminate cached worker to free memory
 */
export async function terminateOCRWorker(): Promise<void> {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {
      // ignore
    }
    activeWorker = null;
    activeWorkerLang = null;
  }
}

/**
 * Native PDF Digital Text Extraction
 * Extracts embedded vector text in logical reading order
 */
export async function extractNativePageText(
  doc: pdfjs.PDFDocumentProxy,
  pageNumber: number
): Promise<{
  text: string;
  hasText: boolean;
  wordCount: number;
  charCount: number;
  lineCount: number;
  lines: OCRLine[];
  words: OCRWord[];
}> {
  const page = await doc.getPage(pageNumber);
  try {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) {
      return {
        text: '',
        hasText: false,
        wordCount: 0,
        charCount: 0,
        lineCount: 0,
        lines: [],
        words: [],
      };
    }

    interface FormattedItem {
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
      hasEOL?: boolean;
    }

    const validItems: FormattedItem[] = [];

    for (const rawItem of items) {
      if ('str' in rawItem && typeof rawItem.str === 'string') {
        const item = rawItem as { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean };
        const x = item.transform[4] || 0;
        const y = item.transform[5] || 0;
        validItems.push({
          str: item.str,
          x,
          y,
          width: item.width || 0,
          height: item.height || 0,
          hasEOL: item.hasEOL,
        });
      }
    }

    // Sort top-to-bottom (Y descending), left-to-right (X ascending)
    validItems.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 6) {
        return yDiff;
      }
      return a.x - b.x;
    });

    const lines: OCRLine[] = [];
    const allWords: OCRWord[] = [];
    let currentLineItems: FormattedItem[] = [];
    let currentLineY: number | null = null;

    const commitLine = () => {
      if (currentLineItems.length === 0) return;
      // Sort items within this line by X position
      currentLineItems.sort((a, b) => a.x - b.x);

      let lineText = '';
      const lineWords: OCRWord[] = [];

      for (let i = 0; i < currentLineItems.length; i++) {
        const item = currentLineItems[i];
        if (i > 0) {
          const prev = currentLineItems[i - 1];
          const gap = item.x - (prev.x + prev.width);
          // Insert space if there is a noticeable gap
          if (gap > 2 && !lineText.endsWith(' ') && !item.str.startsWith(' ')) {
            lineText += ' ';
          }
        }
        lineText += item.str;

        // Split individual item into words
        const wordsInItem = item.str.split(/\s+/).filter(Boolean);
        for (const w of wordsInItem) {
          lineWords.push({
            text: w,
            confidence: 100,
          });
          allWords.push({
            text: w,
            confidence: 100,
          });
        }
      }

      const trimmed = lineText.trim();
      if (trimmed.length > 0) {
        lines.push({
          text: trimmed,
          confidence: 100,
          words: lineWords,
        });
      }
      currentLineItems = [];
    };

    for (const item of validItems) {
      if (currentLineY === null) {
        currentLineY = item.y;
        currentLineItems.push(item);
      } else if (Math.abs(item.y - currentLineY) <= 6) {
        currentLineItems.push(item);
      } else {
        commitLine();
        currentLineY = item.y;
        currentLineItems.push(item);
      }

      if (item.hasEOL) {
        commitLine();
        currentLineY = null;
      }
    }
    commitLine();

    const fullText = lines.map((l) => l.text).join('\n');
    const charCount = fullText.replace(/\s+/g, '').length;
    const wordCount = allWords.length;

    return {
      text: fullText,
      hasText: charCount >= 15, // Meaningful text threshold
      wordCount,
      charCount,
      lineCount: lines.length,
      lines,
      words: allWords,
    };
  } finally {
    page.cleanup();
  }
}

/**
 * Optical Character Recognition using Tesseract.js WebAssembly
 */
export async function runTesseractOCR(
  canvas: HTMLCanvasElement,
  lang: string = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<{
  text: string;
  confidence: number;
  lines: OCRLine[];
  words: OCRWord[];
}> {
  const worker = await getTesseractWorker(lang, onProgress);

  onProgress?.(0.2, 'Running deep AI optical scan...');
  const result = await worker.recognize(canvas);
  const data = result.data;

  const text = (data.text || '').trim();
  const overallConfidence = Math.round(data.confidence || 0);

  const lines: OCRLine[] = [];
  const words: OCRWord[] = [];

  if (data.blocks && Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (block.paragraphs) {
        for (const p of block.paragraphs) {
          if (p.lines) {
            for (const l of p.lines) {
              const lineWords: OCRWord[] = (l.words || []).map((w) => ({
                text: w.text,
                confidence: Math.round(w.confidence || overallConfidence),
                bbox: w.bbox
                  ? {
                      x0: w.bbox.x0,
                      y0: w.bbox.y0,
                      x1: w.bbox.x1,
                      y1: w.bbox.y1,
                    }
                  : undefined,
              }));

              const trimmedLine = l.text.trim();
              if (trimmedLine.length > 0) {
                lines.push({
                  text: trimmedLine,
                  confidence: Math.round(l.confidence || overallConfidence),
                  words: lineWords,
                });
              }
              words.push(...lineWords);
            }
          }
        }
      }
    }
  }

  // Fallback if blocks were not populated
  if (lines.length === 0 && text.length > 0) {
    const textLines = text.split('\n').filter((l) => l.trim().length > 0);
    for (const tl of textLines) {
      const lWords = tl.split(/\s+/).filter(Boolean).map((w) => ({
        text: w,
        confidence: overallConfidence,
      }));
      lines.push({
        text: tl.trim(),
        confidence: overallConfidence,
        words: lWords,
      });
      words.push(...lWords);
    }
  }

  return {
    text,
    confidence: overallConfidence,
    lines,
    words,
  };
}

export interface RecognizePageOptions {
  doc: pdfjs.PDFDocumentProxy;
  pageNumber: number;
  renderer: PDFPageRenderer;
  filterConfig?: PageFilterConfig;
  mode?: OCREngineMode;
  lang?: string;
  enhanceImage?: boolean;
  onProgress?: (progress: number, status: string) => void;
  shouldCancel?: () => boolean;
}

/**
 * Unified PDF Page Recognition:
 * Intelligently routes between Instant Native Text Extraction and Deep AI WASM OCR
 */
export async function recognizePDFPage({
  doc,
  pageNumber,
  renderer,
  filterConfig,
  mode = 'auto',
  lang = 'eng',
  enhanceImage = true,
  onProgress,
  shouldCancel,
}: RecognizePageOptions): Promise<OCRPageResult> {
  const startTime = performance.now();

  if (shouldCancel?.()) {
    throw new Error('Recognition cancelled by user');
  }

  // 1. AUTO or NATIVE Mode: Attempt Native Vector Extraction first
  if (mode === 'auto' || mode === 'native') {
    onProgress?.(0.15, 'Checking native digital text layer...');
    const native = await extractNativePageText(doc, pageNumber);

    if (shouldCancel?.()) {
      throw new Error('Recognition cancelled by user');
    }

    if (native.hasText || mode === 'native') {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        pageNumber,
        text: native.text,
        confidence: 100,
        source: 'native',
        engineName: 'Instant Native PDF Engine',
        wordCount: native.wordCount,
        charCount: native.charCount,
        lineCount: native.lineCount,
        durationMs,
        lines: native.lines,
        words: native.words,
        timestamp: Date.now(),
      };
    }
  }

  // 2. OCR Mode (or Auto fallback when page is scanned/empty text):
  if (shouldCancel?.()) {
    throw new Error('Recognition cancelled by user');
  }

  onProgress?.(0.2, 'Rendering high-definition page for OCR scan...');
  // Render page at scale 2.0 (crisp ~150-200 DPI, optimal for OCR character edges)
  const pristineCanvas = await renderer.renderPagePristine(pageNumber, 2.0);

  if (shouldCancel?.()) {
    throw new Error('Recognition cancelled by user');
  }

  let ocrCanvas: HTMLCanvasElement = pristineCanvas;

  // If enhanceImage is enabled and user has filters/adjustments, use filtered canvas
  if (enhanceImage && filterConfig) {
    ocrCanvas = createFilteredCanvas(pristineCanvas, filterConfig.presetId, filterConfig.adjustments);
  }

  const ocrResult = await runTesseractOCR(ocrCanvas, lang, onProgress);

  if (shouldCancel?.()) {
    throw new Error('Recognition cancelled by user');
  }

  const durationMs = Math.round(performance.now() - startTime);
  const wordsCount = ocrResult.words.length;
  const charCount = ocrResult.text.replace(/\s+/g, '').length;
  const lineCount = ocrResult.lines.length;

  return {
    pageNumber,
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    source: 'ocr',
    engineName: `Tesseract AI Engine (${lang.toUpperCase()})`,
    wordCount: wordsCount,
    charCount,
    lineCount,
    durationMs,
    lines: ocrResult.lines,
    words: ocrResult.words,
    timestamp: Date.now(),
  };
}
