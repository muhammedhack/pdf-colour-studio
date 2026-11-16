import React from 'react';
import { Check } from 'lucide-react';
import type { FilterPresetDefinition } from '../types/filters';

interface FilterCardProps {
  preset: FilterPresetDefinition;
  isSelected: boolean;
  onClick: () => void;
}

export const FilterCard: React.FC<FilterCardProps> = ({
  preset,
  isSelected,
  onClick,
}) => {
  const [color1, color2] = preset.previewColors;

  return (
    <button
      type="button"
      onClick={onClick}
      title={preset.description}
      className={`group relative text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
      }`}
    >
      {/* Visual swatch thumbnail */}
      <div
        className="w-full h-11 rounded-lg mb-2 relative overflow-hidden border border-slate-200/50 shadow-inner"
        style={{
          background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        }}
      >
        {/* Subtle decorative document lines simulation inside swatch */}
        <div className="absolute inset-0 p-1.5 opacity-30 flex flex-col justify-around">
          <div className="h-1 bg-white/70 rounded-full w-2/3"></div>
          <div className="h-1 bg-white/70 rounded-full w-4/5"></div>
          <div className="h-1 bg-white/70 rounded-full w-1/2"></div>
        </div>

        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Preset details */}
      <div className="w-full">
        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
          {preset.name}
        </p>
        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
          {preset.description}
        </p>
      </div>
    </button>
  );
};
