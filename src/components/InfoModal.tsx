import React from 'react';
import { X, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  type: 'privacy' | 'howItWorks';
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {type === 'privacy' ? (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              ) : (
                <Cpu className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {type === 'privacy' ? 'Privacy & Security Guarantee' : 'How PDF Color Studio Works'}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'privacy' ? 'Local-first architecture' : 'Under the hood'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {type === 'privacy' ? (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-1.5 text-emerald-900">
              <div className="flex items-center font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                100% In-Browser Local Processing
              </div>
              <p className="text-emerald-800">
                Your PDF files are never uploaded to any remote server, cloud API, or database. Everything runs strictly in your browser memory.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-sm">How your privacy is protected:</h4>
              <ul className="space-y-2 pl-4 list-disc">
                <li>
                  <strong className="text-slate-800">Zero Network Transmission:</strong> Once the web page assets are loaded, all rendering, filtering, and re-exporting are executed locally by your CPU and GPU.
                </li>
                <li>
                  <strong className="text-slate-800">No Account Required:</strong> You don't need to sign up, provide an email address, or disclose any personal identity.
                </li>
                <li>
                  <strong className="text-slate-800">Immediate Memory Cleanup:</strong> Closing the tab completely wipes all cached page bitmaps and document buffers from RAM.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Upload & Vector Parsing</h4>
                  <p className="text-slate-500">
                    Your PDF is parsed locally using PDF.js WebAssembly workers. High-DPI pristine vector canvases are rendered in memory without degrading quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Real-Time Pixel Transformation</h4>
                  <p className="text-slate-500">
                    When you choose a preset or move a slider, an optimized single-pass pixel shader processes the image data in under 20 milliseconds using requestAnimationFrame for zero-lag 60fps previews.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Multi-Page High-DPI Re-Assembly</h4>
                  <p className="text-slate-500">
                    jsPDF packages the processed pages with their exact original aspect ratios and dimensions at 150, 200, or 300 DPI, directly initiating your browser download.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">AI OCR & Audio Reading Setup</h4>
                  <p className="text-slate-500">
                    Tesseract.js WASM and PDF.js extract text in Malayalam, English, Hindi, and 14+ languages. Features live Speech-to-Audio reading, in-text search, and export to TXT, JSON, MD, or PDF report.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
