import { useState } from 'react';
import { usePDFDocument } from './hooks/usePDFDocument';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UploadArea } from './components/UploadArea';
import { PDFWorkspace } from './components/PDFWorkspace';
import { InfoModal } from './components/InfoModal';
import { Footer } from './components/Footer';
import {
  Sliders,
  FileCheck,
  Palette,
  Brain,
} from 'lucide-react';

export function App() {
  const {
    loadedPDF,
    isLoading,
    error,
    renderer,
    loadFile,
    loadSample,
    resetDocument,
  } = usePDFDocument();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'privacy' | 'howItWorks';
  }>({
    isOpen: false,
    type: 'privacy',
  });

  const openPrivacyModal = () => setModalState({ isOpen: true, type: 'privacy' });
  const openHowItWorksModal = () => setModalState({ isOpen: true, type: 'howItWorks' });
  const closeModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        hasDocument={!!loadedPDF}
        onOpenNew={resetDocument}
        onOpenPrivacy={openPrivacyModal}
        onOpenHowItWorks={openHowItWorksModal}
      />

      {/* Main Content Area */}
      {loadedPDF && renderer ? (
        // Dedicated PDF Studio Editing Workspace
        <main className="flex-1 flex flex-col">
          <PDFWorkspace
            loadedPDF={loadedPDF}
            renderer={renderer}
            onOpenNew={resetDocument}
          />
        </main>
      ) : (
        // Landing / Upload Experience
        <main className="flex-1">
          <Hero
            onUploadClick={() => {
              const el = document.querySelector('input[type="file"]') as HTMLInputElement;
              el?.click();
            }}
            onSampleClick={loadSample}
            isLoading={isLoading}
          />

          <UploadArea
            onFileSelect={loadFile}
            onSampleSelect={loadSample}
            isLoading={isLoading}
            error={error}
          />

          {/* How It Works Showcase Section */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Studio Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
                Designed for Speed, Precision, and Absolute Privacy
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Everything you need to color-grade, scan-binarize, or restyle your PDF documents right in your web browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">25+ Photo-Style Presets</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose from Sepia, Vintage, Duotone, Hollywood Cinematic, Warm Golden Hour, or monochromatic tints. Filter previews update with zero latency.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Advanced Image Controls</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Finely tune brightness, contrast, saturation, exposure, temperature, and true 3×3 matrix sharpness with live real-time slider debouncing.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">AI OCR & Audio Reader</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Extract text from scanned PDFs in Malayalam, English, Hindi & 14+ languages. Listen aloud with Speech-to-Audio and export to TXT, JSON or Markdown.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Up to 300 DPI Export</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export multi-page documents while strictly preserving their original page order, aspect ratios, and orientations at standard or print resolutions.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <Footer
            onOpenPrivacy={openPrivacyModal}
            onOpenHowItWorks={openHowItWorksModal}
          />
        </main>
      )}

      {/* Info / Privacy Modal */}
      <InfoModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={closeModal}
      />
    </div>
  );
}

export default App;
