import React from 'react';
import type { ExportProgress } from '../types/pdf';
import { Loader2, X } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: ExportProgress;
  onCancel: () => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  onCancel,
}) => {
  if (!progress.isExporting) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Processing & Exporting</h4>
              <p className="text-xs text-slate-500">Generating your customized document</p>
            </div>
          </div>
          {progress.canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cancel export"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status text & Percentage */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-700 truncate max-w-[260px]">
              {progress.statusText}
            </span>
            <span className="font-mono font-bold text-indigo-600 text-xs">
              {progress.percentage}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Footer info & Cancel CTA */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <span>
            Page {progress.currentPage} of {progress.totalPages}
          </span>
          {progress.canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Cancel Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
