import React from 'react';
import { Palette } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenHowItWorks: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenHowItWorks }) => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Palette className="w-4 h-4 text-indigo-300" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">PDF Color Studio</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            All PDF processing is executed 100% locally in your browser. No files are ever sent to external servers or cloud storages.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-6 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Privacy Guarantee
          </button>
          <a
            href="https://github.com/mozilla/pdf.js"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Powered by PDF.js & jsPDF
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-400 text-center md:text-right">
          <p>© {new Date().getFullYear()} PDF Color Studio. All rights reserved.</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Ultra-fast, private browser utility.</p>
        </div>
      </div>
    </footer>
  );
};
