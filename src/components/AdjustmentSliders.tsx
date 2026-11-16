import React from 'react';
import type { ColorAdjustments, FilterPresetId } from '../types/filters';
import { RotateCcw, Sun, Contrast, Droplets, Thermometer, SlidersHorizontal, Eye, Compass, Wand2 } from 'lucide-react';

interface AdjustmentSlidersProps {
  adjustments: ColorAdjustments;
  activePresetId: FilterPresetId;
  onChange: (key: keyof ColorAdjustments, value: number) => void;
  onReset: () => void;
}

export const AdjustmentSliders: React.FC<AdjustmentSlidersProps> = ({
  adjustments,
  activePresetId,
  onChange,
  onReset,
}) => {
  const isBlackAndWhite = activePresetId === 'blackAndWhite';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/70">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Fine-Tune Adjustments
        </span>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium px-2 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset Sliders
        </button>
      </div>

      {/* Special B&W Threshold Slider if Black & White preset is active */}
      {isBlackAndWhite && (
        <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-900 flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              B&W Binarization Threshold
            </span>
            <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
              {adjustments.bwThreshold}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="240"
            value={adjustments.bwThreshold}
            onChange={(e) => onChange('bwThreshold', Number(e.target.value))}
            className="accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-indigo-600/80">
            <span>Cleaner Paper (Lower)</span>
            <span>Bolder Text / Ink (Higher)</span>
          </div>
        </div>
      )}

      {/* Standard Sliders Grid */}
      <div className="space-y-3.5 text-xs">
        {/* Brightness */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Brightness
            </span>
            <span className="font-mono text-slate-500">{adjustments.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={adjustments.brightness}
            onChange={(e) => onChange('brightness', Number(e.target.value))}
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Contrast className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Contrast
            </span>
            <span className="font-mono text-slate-500">{adjustments.contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={adjustments.contrast}
            onChange={(e) => onChange('contrast', Number(e.target.value))}
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Droplets className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Saturation
            </span>
            <span className="font-mono text-slate-500">{adjustments.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={adjustments.saturation}
            onChange={(e) => onChange('saturation', Number(e.target.value))}
          />
        </div>

        {/* Exposure */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Exposure
            </span>
            <span className="font-mono text-slate-500">{adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.exposure}
            onChange={(e) => onChange('exposure', Number(e.target.value))}
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Thermometer className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> Temperature
            </span>
            <span className="font-mono text-slate-500">{adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustments.temperature}
            onChange={(e) => onChange('temperature', Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>Cool (Blue)</span>
            <span>Neutral</span>
            <span>Warm (Amber)</span>
          </div>
        </div>

        {/* Hue */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Hue Shift
            </span>
            <span className="font-mono text-slate-500">{adjustments.hue}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={adjustments.hue}
            onChange={(e) => onChange('hue', Number(e.target.value))}
          />
        </div>

        {/* Sharpness (Real 3x3 unsharp convolution kernel) */}
        <div>
          <div className="flex justify-between items-center mb-1 text-slate-700 font-medium">
            <span className="flex items-center">
              <Wand2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Sharpness (Unsharp Mask)
            </span>
            <span className="font-mono text-slate-500">{adjustments.sharpness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={adjustments.sharpness}
            onChange={(e) => onChange('sharpness', Number(e.target.value))}
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Edge-preserving 3×3 matrix unsharp filter</p>
        </div>
      </div>
    </div>
  );
};
