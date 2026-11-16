import React, { useState } from 'react';
import type { FilterPresetId, FilterCategory } from '../types/filters';
import { FILTER_PRESETS, FILTER_CATEGORIES } from '../lib/filters/filterPresets';
import { FilterCard } from './FilterCard';

interface FilterPanelProps {
  selectedPresetId: FilterPresetId;
  onSelectPreset: (presetId: FilterPresetId) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedPresetId,
  onSelectPreset,
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory | 'all'>('all');

  const filteredPresets = FILTER_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({FILTER_PRESETS.length})
        </button>

        {FILTER_CATEGORIES.map((cat) => {
          const count = FILTER_PRESETS.filter((p) => p.category === cat.id).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <FilterCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPresetId === preset.id}
            onClick={() => onSelectPreset(preset.id)}
          />
        ))}
      </div>
    </div>
  );
};
