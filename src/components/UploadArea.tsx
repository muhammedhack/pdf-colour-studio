import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: () => void;
  isLoading: boolean;
  error: string | null;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelect,
  onSampleSelect,
  isLoading,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndProcess = (file: File) => {
    setValidationError(null);

    // Verify MIME type or extension
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      setValidationError('Please select a valid PDF file (.pdf). Other formats are not supported.');
      return;
    }

    if (file.size === 0) {
      setValidationError('The selected PDF file is empty (0 bytes).');
      return;
    }

    // Max 100MB warning/check
    if (file.size > 100 * 1024 * 1024) {
      setValidationError('This PDF is very large (> 100 MB). Processing may require extra memory.');
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const activeError = validationError || error;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/70 shadow-sm'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {/* Central Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5 shadow-xs border border-indigo-100/80">
          {isLoading ? (
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-600" />
          ) : (
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.75]" />
          )}
        </div>

        {/* Action text */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
          {isLoading ? 'Reading and Preparing PDF...' : 'Choose a PDF file or drag & drop here'}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {isLoading
            ? 'Parsing document structure and generating instant page previews...'
            : 'Select any PDF document from your device. All rendering and color transformations happen locally in your browser.'}
        </p>

        {/* Button & Alternative */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer"
            >
              Browse Files
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSampleSelect();
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
              Try with Sample Document
            </button>
          </div>
        )}
      </div>

      {/* Error state alert */}
      {activeError && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start space-x-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="text-sm">
            <p className="font-semibold">Unable to open PDF</p>
            <p className="text-rose-600/90">{activeError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
