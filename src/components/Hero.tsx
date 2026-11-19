import React from 'react';
import { UploadCloud, Sparkles, Shield, Zap, FileCheck, Layers, Brain } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onSampleClick: () => void;
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onUploadClick,
  onSampleClick,
  isLoading,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Top badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Professional PDF Color Studio 2.0</span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
          Transform Your PDFs with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            Beautiful Colors
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Apply stunning color filters to your PDF documents. Preview instantly and download your customized PDF in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
          <button
            type="button"
            onClick={onUploadClick}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md shadow-slate-900/15 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-5 h-5 mr-2.5 text-indigo-300" />
            Upload PDF Document
          </button>

          <button
            type="button"
            onClick={onSampleClick}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300/80 active:scale-[0.98] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
            Try with Sample PDF
          </button>
        </div>

        {/* Supporting Trust text */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
          <span className="inline-flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Free to use
          </span>
          <span>•</span>
          <span className="inline-flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
            No registration
          </span>
          <span>•</span>
          <span className="inline-flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
            Files stay on your device
          </span>
        </p>

        {/* Key Feature Badges */}
        <div className="mt-10 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-left">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>25+ Color Presets</span>
            </div>
            <p className="text-xs text-slate-500">Sepia, duotone, cinematic, vintage, artistic & more.</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Real 1-Bit B&W</span>
            </div>
            <p className="text-xs text-slate-500">Genuine threshold binarization for clean scans.</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>AI OCR & Reader</span>
            </div>
            <p className="text-xs text-slate-500">Multilingual text recognition & audio reading.</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Up to 300 DPI</span>
            </div>
            <p className="text-xs text-slate-500">Standard, High, & Ultra-sharp Print export options.</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>100% Client-Side</span>
            </div>
            <p className="text-xs text-slate-500">Zero cloud uploads. Total privacy guaranteed.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
