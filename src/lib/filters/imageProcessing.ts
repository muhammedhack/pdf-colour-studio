import type { FilterPresetId, ColorAdjustments } from '../../types/filters';

/**
 * Fast clamp utility
 */
export function clamp(val: number, min: number = 0, max: number = 255): number {
  return val < min ? min : val > max ? max : val;
}

/**
 * Fast RGB to HSL and back for Hue adjustment
 */
function rotateHue(r: number, g: number, b: number, angleDeg: number): [number, number, number] {
  if (angleDeg === 0) return [r, g, b];
  const rad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Matrix hue rotation
  const rx = (0.213 + cosA * 0.787 - sinA * 0.213) * r +
             (0.715 - cosA * 0.715 - sinA * 0.715) * g +
             (0.072 - cosA * 0.072 + sinA * 0.928) * b;

  const gx = (0.213 - cosA * 0.213 + sinA * 0.143) * r +
             (0.715 + cosA * 0.285 + sinA * 0.140) * g +
             (0.072 - cosA * 0.072 - sinA * 0.283) * b;

  const bx = (0.213 - cosA * 0.213 - sinA * 0.787) * r +
             (0.715 - cosA * 0.715 + sinA * 0.715) * g +
             (0.072 + cosA * 0.928 + sinA * 0.072) * b;

  return [clamp(rx), clamp(gx), clamp(bx)];
}

/**
 * Maps grayscale luminance to a duo-color gradient
 */
function duotoneMap(lum: number, c1: [number, number, number], c2: [number, number, number]): [number, number, number] {
  const t = lum / 255;
  return [
    clamp(c1[0] + (c2[0] - c1[0]) * t),
    clamp(c1[1] + (c2[1] - c1[1]) * t),
    clamp(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

/**
 * Applies a 3x3 unsharp mask convolution kernel for genuine sharpness
 */
export function applyConvolutionSharpness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sharpnessAmount: number // 0 to 100
): void {
  if (sharpnessAmount <= 0) return;
  const k = (sharpnessAmount / 100) * 0.8; // kernel strength
  const center = 1 + 4 * k;
  const edge = -k;

  const original = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    const rowPrev = (y - 1) * width * 4;
    const rowCurr = y * width * 4;
    const rowNext = (y + 1) * width * 4;

    for (let x = 1; x < width - 1; x++) {
      const idx = rowCurr + x * 4;
      const idxTop = rowPrev + x * 4;
      const idxBottom = rowNext + x * 4;
      const idxLeft = rowCurr + (x - 1) * 4;
      const idxRight = rowCurr + (x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          original[idx + c] * center +
          (original[idxTop + c] +
           original[idxBottom + c] +
           original[idxLeft + c] +
           original[idxRight + c]) * edge;
        data[idx + c] = clamp(val);
      }
    }
  }
}

/**
 * Main fast pixel processing function that applies both the Preset and the Adjustments in a single pass
 */
export function processImageData(
  imageData: ImageData,
  presetId: FilterPresetId,
  adjustments: ColorAdjustments
): void {
  const data = imageData.data;
  const len = data.length;

  const {
    brightness = 100,
    contrast = 100,
    saturation = 100,
    exposure = 0,
    temperature = 0,
    hue = 0,
    sharpness = 0,
    bwThreshold = 128,
  } = adjustments;

  // Pre-calculated multipliers for high performance
  const bMult = brightness / 100;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const satMult = saturation / 100;
  const expMult = Math.pow(2, exposure / 50);

  // Precompute color tone targets for duotone/color filters
  let toneShadow: [number, number, number] = [0, 0, 0];
  let toneHighlight: [number, number, number] = [255, 255, 255];

  const hasDuotone = [
    'redTone', 'blueTone', 'greenTone', 'purpleTone',
    'orangeTone', 'pinkTone', 'yellowTone', 'duotone', 'cinematic'
  ].includes(presetId);

  if (hasDuotone) {
    switch (presetId) {
      case 'redTone':
        toneShadow = [40, 0, 10];
        toneHighlight = [255, 210, 215];
        break;
      case 'blueTone':
        toneShadow = [10, 25, 60];
        toneHighlight = [215, 235, 255];
        break;
      case 'greenTone':
        toneShadow = [10, 40, 20];
        toneHighlight = [220, 255, 230];
        break;
      case 'purpleTone':
        toneShadow = [35, 10, 50];
        toneHighlight = [245, 225, 255];
        break;
      case 'orangeTone':
        toneShadow = [45, 15, 0];
        toneHighlight = [255, 235, 210];
        break;
      case 'pinkTone':
        toneShadow = [45, 10, 30];
        toneHighlight = [255, 225, 240];
        break;
      case 'yellowTone':
        toneShadow = [40, 35, 0];
        toneHighlight = [255, 250, 200];
        break;
      case 'duotone':
        toneShadow = [15, 23, 42]; // deep navy slate
        toneHighlight = [249, 115, 22]; // warm orange coral
        break;
      case 'cinematic':
        toneShadow = [13, 78, 88]; // deep teal
        toneHighlight = [254, 215, 170]; // warm orange/amber highlight
        break;
    }
  }

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a === 0) continue;

    // 1. Base Preset Transform
    switch (presetId) {
      case 'original':
        // no modification
        break;

      case 'grayscale': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray;
        g = gray;
        b = gray;
        break;
      }

      case 'blackAndWhite': {
        // Document Text-Preserving Black & White (Scanner / Photocopy grade)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

        // Standard perceived luminance
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Preserve colored text (blue links, red warnings, colored headings, pastel text)
        // so they don't get washed out as white paper
        if (sat > 0.15 && lum < 240) {
          lum = lum * (1 - sat * 0.45);
        }

        // Smooth anti-aliased high-contrast binarization
        const t = bwThreshold;
        const windowHalf = 20;

        let bw: number;
        if (lum >= t + windowHalf) {
          bw = 255; // pure clean white paper
        } else if (lum <= t - windowHalf) {
          bw = 0;   // crisp deep black text
        } else {
          // Hermite smoothstep for anti-aliasing edges so text curves are not jagged or broken
          const norm = (lum - (t - windowHalf)) / (2 * windowHalf);
          const smooth = norm * norm * (3 - 2 * norm);
          bw = smooth * 255;
        }

        r = bw;
        g = bw;
        b = bw;
        break;
      }

      case 'highContrast': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const hc = ((lum - 128) * 1.6) + 128;
        r = (r - lum) * 1.2 + hc;
        g = (g - lum) * 1.2 + hc;
        b = (b - lum) * 1.2 + hc;
        break;
      }

      case 'light': {
        r = r * 1.15 + 15;
        g = g * 1.15 + 15;
        b = b * 1.15 + 15;
        break;
      }

      case 'dark': {
        r = r * 0.85 - 10;
        g = g * 0.85 - 10;
        b = b * 0.85 - 10;
        break;
      }

      case 'sepia': {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = sr;
        g = sg;
        b = sb;
        break;
      }

      case 'vintage': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r * 0.9 + lum * 0.1 + 20;
        g = g * 0.85 + lum * 0.15 + 15;
        b = b * 0.7 + lum * 0.2;
        break;
      }

      case 'warm': {
        r = r * 1.1 + 10;
        g = g * 1.02;
        b = b * 0.88 - 8;
        break;
      }

      case 'cool': {
        r = r * 0.88 - 5;
        g = g * 1.02;
        b = b * 1.14 + 12;
        break;
      }

      case 'faded': {
        // lift blacks and compress highlights
        r = r * 0.75 + 40;
        g = g * 0.75 + 40;
        b = b * 0.75 + 40;
        break;
      }

      case 'retro': {
        r = r * 1.15 + 12;
        g = g * 0.95 + 8;
        b = b * 0.75;
        break;
      }

      case 'invertColors': {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
        break;
      }

      case 'negative': {
        // Film negative with enhanced curves
        r = Math.pow((255 - r) / 255, 1.2) * 255;
        g = Math.pow((255 - g) / 255, 1.2) * 255;
        b = Math.pow((255 - b) / 255, 1.2) * 255;
        break;
      }

      case 'monochrome': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const stark = ((lum - 128) * 1.8) + 128;
        r = stark;
        g = stark;
        b = stark;
        break;
      }

      case 'softContrast': {
        r = (r - 128) * 0.85 + 130;
        g = (g - 128) * 0.85 + 130;
        b = (b - 128) * 0.85 + 130;
        break;
      }

      case 'redTone':
      case 'blueTone':
      case 'greenTone':
      case 'purpleTone':
      case 'orangeTone':
      case 'pinkTone':
      case 'yellowTone':
      case 'duotone':
      case 'cinematic': {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const mapped = duotoneMap(lum, toneShadow, toneHighlight);
        r = mapped[0];
        g = mapped[1];
        b = mapped[2];
        break;
      }
    }

    // 2. Adjustments: Exposure
    if (exposure !== 0) {
      r *= expMult;
      g *= expMult;
      b *= expMult;
    }

    // 3. Adjustments: Brightness
    if (brightness !== 100) {
      r *= bMult;
      g *= bMult;
      b *= bMult;
    }

    // 4. Adjustments: Contrast
    if (contrast !== 100) {
      r = ((r - 128) * contrastFactor) + 128;
      g = ((g - 128) * contrastFactor) + 128;
      b = ((b - 128) * contrastFactor) + 128;
    }

    // 5. Adjustments: Saturation
    if (saturation !== 100) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satMult;
      g = gray + (g - gray) * satMult;
      b = gray + (b - gray) * satMult;
    }

    // 6. Adjustments: Temperature
    if (temperature !== 0) {
      const tempFactor = temperature * 0.5;
      r += tempFactor;
      b -= tempFactor;
    }

    // 7. Adjustments: Hue
    if (hue !== 0) {
      const [hr, hg, hb] = rotateHue(r, g, b, hue);
      r = hr;
      g = hg;
      b = hb;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  // 8. Genuine Sharpness (Convolution Unsharp Mask)
  if (sharpness > 0) {
    applyConvolutionSharpness(data, imageData.width, imageData.height, sharpness);
  }
}
