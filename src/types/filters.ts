export type FilterCategory = 'basic' | 'artistic' | 'color' | 'special';

export type FilterPresetId =
  // Basic Filters
  | 'original'
  | 'grayscale'
  | 'blackAndWhite'
  | 'highContrast'
  | 'light'
  | 'dark'
  // Artistic Filters
  | 'sepia'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'faded'
  | 'retro'
  // Color Filters
  | 'redTone'
  | 'blueTone'
  | 'greenTone'
  | 'purpleTone'
  | 'orangeTone'
  | 'pinkTone'
  | 'yellowTone'
  // Special Filters
  | 'invertColors'
  | 'negative'
  | 'monochrome'
  | 'duotone'
  | 'cinematic'
  | 'softContrast';

export interface ColorAdjustments {
  brightness: number; // 0 - 200%, default 100
  contrast: number;   // 0 - 200%, default 100
  saturation: number; // 0 - 200%, default 100
  exposure: number;   // -100 to 100, default 0
  temperature: number;// -100 (cool) to 100 (warm), default 0
  hue: number;        // -180 to 180 deg, default 0
  sharpness: number;  // 0 to 100%, default 0
  bwThreshold: number;// 0 to 255, default 128 (for black & white mode)
}

export interface PageFilterConfig {
  presetId: FilterPresetId;
  adjustments: ColorAdjustments;
  isCustomized?: boolean;
}

export interface FilterPresetDefinition {
  id: FilterPresetId;
  name: string;
  category: FilterCategory;
  description: string;
  previewColors: [string, string]; // gradient or pair of representative colors
  defaultAdjustments?: Partial<ColorAdjustments>;
}

export const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  temperature: 0,
  hue: 0,
  sharpness: 0,
  bwThreshold: 165,
};

export const DEFAULT_PAGE_FILTER_CONFIG: PageFilterConfig = {
  presetId: 'original',
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  isCustomized: false,
};
