export interface PDFDocumentInfo {
  name: string;
  size: number;
  pageCount: number;
  fingerprint?: string | null;
}

export interface PageDimensions {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
}

export type ExportQuality = 'standard' | 'high' | 'print';

export type CompressionMode = 'smart' | 'lossless' | 'compact';

export interface ExportQualityConfig {
  label: string;
  dpi: number;
  scale: number;
  description: string;
}

export type ExportFormat = 'pdf' | 'png' | 'jpg';

export interface ExportProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  statusText: string;
  isExporting: boolean;
  canCancel: boolean;
}
