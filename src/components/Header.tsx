import React from 'react';
import { Palette, ShieldCheck, FileUp } from 'lucide-react';

interface HeaderProps {
  hasDocument: boolean;
  onOpenNew?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHowItWorks?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasDocument,
  onOpenNew,
  onOpenPrivacy,
  onOpenHowItWorks,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-700 flex items-center justify-center shadow-md shadow-slate-900/10 text-white">
            <Palette className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">PDF Color Studio</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> 100% Local
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 font-medium">Fast Client-Side PDF Color Filter Engine</p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            How It Works
          </button>

          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hidden sm:inline-flex items-center text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Privacy
          </button>

          {hasDocument && (
            <button
              type="button"
              onClick={onOpenNew}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-slate-600" />
              <span>New PDF</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
