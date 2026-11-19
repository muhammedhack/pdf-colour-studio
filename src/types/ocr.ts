export interface OCRWord {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OCRLine {
  text: string;
  confidence: number;
  words?: OCRWord[];
}

export interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence: number; // 0 - 100
  source: 'native' | 'ocr';
  engineName: string;
  wordCount: number;
  charCount: number;
  lineCount: number;
  durationMs: number;
  lines?: OCRLine[];
  words?: OCRWord[];
  timestamp: number;
}

export type OCREngineMode = 'auto' | 'ocr' | 'native';

export interface OCRLanguageOption {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
}

export interface OCRJobStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  statusText: string;
  stage: 'idle' | 'initializing' | 'rendering' | 'processing' | 'completed' | 'error';
  error: string | null;
  canCancel: boolean;
}

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWordIndex: number;
  rate: number;
  pitch: number;
}
