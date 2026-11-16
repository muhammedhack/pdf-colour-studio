import * as pdfjs from 'pdfjs-dist';
import type { PageDimensions, PDFDocumentInfo } from '../../types/pdf';

// Ensure the PDF.js worker is properly linked
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface LoadedPDF {
  doc: pdfjs.PDFDocumentProxy;
  info: PDFDocumentInfo;
  dimensions: PageDimensions[];
  arrayBuffer: ArrayBuffer;
}

export async function loadPDFDocument(file: File | ArrayBuffer, fileName: string = 'document.pdf'): Promise<LoadedPDF> {
  let arrayBuffer: ArrayBuffer;
  let fileSize: number;

  if (file instanceof File) {
    fileSize = file.size;
    fileName = file.name;
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
    fileSize = arrayBuffer.byteLength;
  }

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('The selected file is empty. Please choose a valid PDF file.');
  }

  // Validate PDF header magic bytes "%PDF-"
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
  const headerString = String.fromCharCode(...headerBytes);
  if (!headerString.startsWith('%PDF')) {
    throw new Error('Invalid file format. The file does not appear to be a standard PDF document.');
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjs.version + '/cmaps/',
    cMapPacked: true,
  });

  try {
    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;

    if (pageCount === 0) {
      throw new Error('The PDF file contains no pages.');
    }

    const info: PDFDocumentInfo = {
      name: fileName,
      size: fileSize,
      pageCount,
      fingerprint: doc.fingerprints ? doc.fingerprints[0] : undefined,
    };

    // Extract page dimensions for all pages efficiently
    const dimensions: PageDimensions[] = [];
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const width = viewport.width;
      const height = viewport.height;
      dimensions.push({
        pageNumber: pageNum,
        width,
        height,
        aspectRatio: width / height,
        orientation: width > height ? 'landscape' : 'portrait',
      });
      page.cleanup();
    }

    return {
      doc,
      info,
      dimensions,
      arrayBuffer,
    };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err) {
      if (err.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please remove the password to edit colors.');
      }
      if (err.name === 'InvalidPDFException') {
        throw new Error('The PDF document is damaged or could not be decoded.');
      }
    }
    const message = err instanceof Error ? err.message : 'Failed to load PDF file.';
    throw new Error(message);
  }
}
