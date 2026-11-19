import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist';
import type { PageDimensions, ExportQuality, CompressionMode } from '../../types/pdf';
import type { PageFilterConfig } from '../../types/filters';
import type { SplitProgress } from '../../types/split';
import { applyFiltersToCanvas } from '../filters/canvasFilters';

/**
 * Parses a page range string like "1-3, 5, 8-10" into a sorted array of page numbers [1, 2, 3, 5, 8, 9, 10]
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  if (!input || !input.trim()) return [];

  const pages = new Set<number>();
  const parts = input.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pages.add(i);
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Formats a list of page numbers into a clean range string e.g. [1, 2, 3, 5, 7, 8] -> "1-3, 5, 7-8"
 */
export function formatPageRange(pages: number[]): string {
  if (!pages || pages.length === 0) return '';
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

/**
 * Triggers a browser download of a Blob or Uint8Array
 */
function triggerDownload(data: any, fileName: string, mimeType: string = 'application/pdf') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 1. Split Original PDF natively using pdf-lib (Vector, searchable text preserved, instant execution)
 */
export async function splitPDFNative(
  arrayBuffer: ArrayBuffer,
  pageGroups: number[][], // Array of groups. Each group is a list of 1-based page numbers
  baseName: string,
  onProgress?: (progress: SplitProgress) => void
): Promise<void> {
  const cleanBase = baseName.replace(/\.[^/.]+$/, '');
  const totalGroups = pageGroups.length;

  if (onProgress) {
    onProgress({
      isSplitting: true,
      percentage: 10,
      statusText: 'Loading original PDF document...',
      currentStep: 1,
      totalSteps: totalGroups,
    });
  }

  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Case A: Single group -> Output single PDF directly
  if (totalGroups === 1) {
    const pages = pageGroups[0];
    const subDoc = await PDFDocument.create();
    const copiedPages = await subDoc.copyPages(
      srcDoc,
      pages.map((p) => p - 1)
    );
    copiedPages.forEach((p) => subDoc.addPage(p));

    const pdfBytes = await subDoc.save();
    const outName = `${cleanBase}_extracted_p${formatPageRange(pages).replace(/[, ]+/g, '_')}.pdf`;
    triggerDownload(pdfBytes, outName);

    if (onProgress) {
      onProgress({
        isSplitting: false,
        percentage: 100,
        statusText: 'Extracted PDF downloaded successfully!',
        currentStep: 1,
        totalSteps: 1,
      });
    }
    return;
  }

  // Case B: Multiple groups -> Package into a ZIP archive
  const zip = new JSZip();

  for (let g = 0; g < totalGroups; g++) {
    const pages = pageGroups[g];
    const subDoc = await PDFDocument.create();
    const copiedPages = await subDoc.copyPages(
      srcDoc,
      pages.map((p) => p - 1)
    );
    copiedPages.forEach((p) => subDoc.addPage(p));

    const pdfBytes = await subDoc.save();
    const rangeLabel = formatPageRange(pages).replace(/[, ]+/g, '_');
    const fileName = `${cleanBase}_p${rangeLabel}.pdf`;
    zip.file(fileName, pdfBytes);

    if (onProgress) {
      const pct = Math.round(10 + ((g + 1) / totalGroups) * 80);
      onProgress({
        isSplitting: true,
        percentage: pct,
        statusText: `Generated file ${g + 1} of ${totalGroups}...`,
        currentStep: g + 1,
        totalSteps: totalGroups,
      });
    }
  }

  if (onProgress) {
    onProgress({
      isSplitting: true,
      percentage: 95,
      statusText: 'Compressing files into ZIP archive...',
      currentStep: totalGroups,
      totalSteps: totalGroups,
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${cleanBase}_split_files.zip`, 'application/zip');

  if (onProgress) {
    onProgress({
      isSplitting: false,
      percentage: 100,
      statusText: 'Split ZIP archive downloaded successfully!',
      currentStep: totalGroups,
      totalSteps: totalGroups,
    });
  }
}

/**
 * 2. Split PDF with Studio Color Filters applied using jsPDF
 */
export async function splitPDFFiltered(
  doc: pdfjs.PDFDocumentProxy,
  dimensions: PageDimensions[],
  pageConfigs: Map<number, PageFilterConfig>,
  defaultConfig: PageFilterConfig,
  quality: ExportQuality,
  compressionMode: CompressionMode,
  pageGroups: number[][],
  baseName: string,
  onProgress?: (progress: SplitProgress) => void
): Promise<void> {
  const cleanBase = baseName.replace(/\.[^/.]+$/, '');
  const totalGroups = pageGroups.length;
  const dpiScales: Record<ExportQuality, number> = {
    standard: 150 / 72,
    high: 220 / 72,
    print: 300 / 72,
  };
  const scale = dpiScales[quality] || dpiScales.high;

  // Helper to build a jsPDF document for a single page group
  const buildGroupPDF = async (pages: number[]): Promise<Uint8Array> => {
    let pdfDoc: jsPDF | null = null;

    for (const pageNum of pages) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const originalDim = dimensions[pageNum - 1] || {
        width: viewport.width / scale,
        height: viewport.height / scale,
        orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
      };

      const widthPt = originalDim.width;
      const heightPt = originalDim.height;
      const orientation = originalDim.orientation;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = Math.floor(viewport.width);
      sourceCanvas.height = Math.floor(viewport.height);

      const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get 2D rendering context.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas: sourceCanvas,
      }).promise;
      page.cleanup();

      const filterConfig = pageConfigs.get(pageNum) || defaultConfig;
      const filteredCanvas = document.createElement('canvas');
      applyFiltersToCanvas(
        sourceCanvas,
        filteredCanvas,
        filterConfig.presetId,
        filterConfig.adjustments
      );

      sourceCanvas.width = 0;
      sourceCanvas.height = 0;

      if (!pdfDoc) {
        pdfDoc = new jsPDF({
          orientation,
          unit: 'pt',
          format: [widthPt, heightPt],
          compress: true,
        });
      } else {
        pdfDoc.addPage([widthPt, heightPt], orientation);
      }

      const isBW = filterConfig.presetId === 'blackAndWhite' || filterConfig.presetId === 'monochrome';
      let imgData: string;
      let imgFormat: 'PNG' | 'JPEG';

      if (compressionMode === 'lossless' || (compressionMode === 'smart' && isBW)) {
        imgData = filteredCanvas.toDataURL('image/png');
        imgFormat = 'PNG';
      } else if (compressionMode === 'compact') {
        imgData = filteredCanvas.toDataURL('image/jpeg', 0.82);
        imgFormat = 'JPEG';
      } else {
        imgData = filteredCanvas.toDataURL('image/jpeg', 0.94);
        imgFormat = 'JPEG';
      }

      pdfDoc.addImage(imgData, imgFormat, 0, 0, widthPt, heightPt, undefined, 'SLOW');
      filteredCanvas.width = 0;
      filteredCanvas.height = 0;
    }

    if (!pdfDoc) throw new Error('No pages were added to PDF.');
    return new Uint8Array(pdfDoc.output('arraybuffer'));
  };

  // Case A: Single Group -> Direct download
  if (totalGroups === 1) {
    if (onProgress) {
      onProgress({
        isSplitting: true,
        percentage: 30,
        statusText: `Rendering & filtering ${pageGroups[0].length} pages...`,
        currentStep: 1,
        totalSteps: 1,
      });
    }

    const pdfBytes = await buildGroupPDF(pageGroups[0]);
    const rangeLabel = formatPageRange(pageGroups[0]).replace(/[, ]+/g, '_');
    triggerDownload(pdfBytes, `${cleanBase}_filtered_p${rangeLabel}.pdf`);

    if (onProgress) {
      onProgress({
        isSplitting: false,
        percentage: 100,
        statusText: 'Extracted filtered PDF downloaded!',
        currentStep: 1,
        totalSteps: 1,
      });
    }
    return;
  }

  // Case B: Multiple Groups -> ZIP archive
  const zip = new JSZip();

  for (let g = 0; g < totalGroups; g++) {
    const pages = pageGroups[g];
    if (onProgress) {
      const pct = Math.round(10 + (g / totalGroups) * 80);
      onProgress({
        isSplitting: true,
        percentage: pct,
        statusText: `Filtering & rendering file ${g + 1} of ${totalGroups}...`,
        currentStep: g + 1,
        totalSteps: totalGroups,
      });
    }

    const pdfBytes = await buildGroupPDF(pages);
    const rangeLabel = formatPageRange(pages).replace(/[, ]+/g, '_');
    zip.file(`${cleanBase}_filtered_p${rangeLabel}.pdf`, pdfBytes);
  }

  if (onProgress) {
    onProgress({
      isSplitting: true,
      percentage: 95,
      statusText: 'Packaging filtered files into ZIP archive...',
      currentStep: totalGroups,
      totalSteps: totalGroups,
    });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${cleanBase}_filtered_split.zip`, 'application/zip');

  if (onProgress) {
    onProgress({
      isSplitting: false,
      percentage: 100,
      statusText: 'Filtered split files downloaded successfully!',
      currentStep: totalGroups,
      totalSteps: totalGroups,
    });
  }
}
