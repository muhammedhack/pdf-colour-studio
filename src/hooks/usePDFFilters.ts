import { useState, useCallback, useMemo } from 'react';
import type {
  ColorAdjustments,
  FilterPresetId,
  PageFilterConfig,
} from '../types/filters';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_PAGE_FILTER_CONFIG,
} from '../types/filters';
import { FILTER_PRESETS } from '../lib/filters/filterPresets';

export type FilterTargetMode = 'current' | 'all';

export function usePDFFilters() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [targetMode, setTargetMode] = useState<FilterTargetMode>('current');
  const [globalConfig, setGlobalConfig] = useState<PageFilterConfig>({ ...DEFAULT_PAGE_FILTER_CONFIG });
  const [pageConfigs, setPageConfigs] = useState<Map<number, PageFilterConfig>>(new Map());

  // Get active config for a specific page
  const getPageConfig = useCallback(
    (pageNum: number): PageFilterConfig => {
      const custom = pageConfigs.get(pageNum);
      if (custom) return custom;
      return globalConfig;
    },
    [pageConfigs, globalConfig]
  );

  // Active config for the current page
  const activeConfig = useMemo(() => {
    return getPageConfig(currentPage);
  }, [getPageConfig, currentPage]);

  // Check if a page has custom overrides
  const isPageCustomized = useCallback(
    (pageNum: number): boolean => {
      return pageConfigs.has(pageNum);
    },
    [pageConfigs]
  );

  // Set preset for current page or all pages
  const applyPreset = useCallback(
    (presetId: FilterPresetId) => {
      const presetDef = FILTER_PRESETS.find((p) => p.id === presetId);
      const newAdjustments: ColorAdjustments = {
        ...DEFAULT_ADJUSTMENTS,
        ...(presetDef?.defaultAdjustments || {}),
      };

      const newConfig: PageFilterConfig = {
        presetId,
        adjustments: newAdjustments,
        isCustomized: targetMode === 'current',
      };

      if (targetMode === 'all') {
        setGlobalConfig(newConfig);
        setPageConfigs(new Map()); // Clear per-page overrides when applying globally
      } else {
        setPageConfigs((prev) => {
          const next = new Map(prev);
          next.set(currentPage, newConfig);
          return next;
        });
      }
    },
    [targetMode, currentPage]
  );

  // Update a single adjustment slider
  const updateAdjustment = useCallback(
    (key: keyof ColorAdjustments, value: number) => {
      if (targetMode === 'all') {
        setGlobalConfig((prev) => ({
          ...prev,
          adjustments: {
            ...prev.adjustments,
            [key]: value,
          },
        }));
        // Update all existing page configs as well
        setPageConfigs((prev) => {
          if (prev.size === 0) return prev;
          const next = new Map();
          prev.forEach((val, k) => {
            next.set(k, {
              ...val,
              adjustments: {
                ...val.adjustments,
                [key]: value,
              },
            });
          });
          return next;
        });
      } else {
        setPageConfigs((prev) => {
          const current = prev.get(currentPage) || { ...globalConfig, isCustomized: true };
          const next = new Map(prev);
          next.set(currentPage, {
            ...current,
            isCustomized: true,
            adjustments: {
              ...current.adjustments,
              [key]: value,
            },
          });
          return next;
        });
      }
    },
    [targetMode, currentPage, globalConfig]
  );

  // Reset adjustments for current page
  const resetCurrentPage = useCallback(() => {
    setPageConfigs((prev) => {
      const next = new Map(prev);
      next.delete(currentPage);
      return next;
    });
  }, [currentPage]);

  // Reset all pages to original default
  const resetAllPages = useCallback(() => {
    setGlobalConfig({ ...DEFAULT_PAGE_FILTER_CONFIG });
    setPageConfigs(new Map());
  }, []);

  // Apply current page settings to all pages
  const applyCurrentToAll = useCallback(() => {
    const current = getPageConfig(currentPage);
    setGlobalConfig({
      ...current,
      isCustomized: false,
    });
    setPageConfigs(new Map());
  }, [currentPage, getPageConfig]);

  return {
    currentPage,
    setCurrentPage,
    targetMode,
    setTargetMode,
    activeConfig,
    globalConfig,
    pageConfigs,
    getPageConfig,
    isPageCustomized,
    applyPreset,
    updateAdjustment,
    resetCurrentPage,
    resetAllPages,
    applyCurrentToAll,
  };
}
