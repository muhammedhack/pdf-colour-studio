export type SplitAction = 'extract-merged' | 'extract-separate' | 'split-every';

export type SplitEngine = 'filtered' | 'original';

export interface SplitOptions {
  action: SplitAction;
  engine: SplitEngine;
  selectedPages: number[]; // 1-based page numbers
  splitEveryN?: number;   // e.g. every 1 page, every 2 pages
  baseFileName: string;
}

export interface SplitProgress {
  isSplitting: boolean;
  percentage: number;
  statusText: string;
  currentStep: number;
  totalSteps: number;
}
