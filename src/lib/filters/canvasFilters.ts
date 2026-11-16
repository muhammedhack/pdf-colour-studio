import type { FilterPresetId, ColorAdjustments } from '../../types/filters';
import { processImageData } from './imageProcessing';

/**
 * Renders sourceCanvas onto targetCanvas with full preset & color adjustments applied
 */
export function applyFiltersToCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  presetId: FilterPresetId,
  adjustments: ColorAdjustments
): void {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  // Copy pristine rendered page onto target canvas
  targetCtx.drawImage(sourceCanvas, 0, 0);

  // If original with default adjustments, nothing more needed!
  const isDefaultAdjustments =
    adjustments.brightness === 100 &&
    adjustments.contrast === 100 &&
    adjustments.saturation === 100 &&
    adjustments.exposure === 0 &&
    adjustments.temperature === 0 &&
    adjustments.hue === 0 &&
    adjustments.sharpness === 0;

  if (presetId === 'original' && isDefaultAdjustments) {
    return;
  }

  // Extract pixel data and process in a single unified pass
  const imageData = targetCtx.getImageData(0, 0, width, height);
  processImageData(imageData, presetId, adjustments);
  targetCtx.putImageData(imageData, 0, 0);
}

/**
 * Creates a standalone offscreen canvas with filters applied
 */
export function createFilteredCanvas(
  sourceCanvas: HTMLCanvasElement,
  presetId: FilterPresetId,
  adjustments: ColorAdjustments
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  applyFiltersToCanvas(sourceCanvas, canvas, presetId, adjustments);
  return canvas;
}
