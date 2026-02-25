'use client';

import { cn } from '@/lib/utils';
import { useTestSessionStore } from '@/store/test-session';
import { AlertCircle, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

/* ═══════════════════════════════════════════════════════
   UploadStep — Step 1 of the test workflow wizard.
   
   Drag-and-drop zone for XLSX/XLS files. 
   Now accepts props to handle file selection via useExcelUpload hook.
   ═══════════════════════════════════════════════════════ */

interface UploadStepProps {
    onFileSelect: (file: File) => Promise<void>;
    isParsing: boolean;
}

export function UploadStep({ onFileSelect, isParsing }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { goToStep, parseError } = useTestSessionStore(); 
  // We still might use store for global step navigation or error display if we sync error state,
  // but ideally we should pass error as prop too. For now let's assume the hook handles errors internally in rows.
  // Actually, useExcelUpload stores row-level errors. Global parse error might need to be passed down if we want to show it here.
  // The original store had "parseError". 
  // Let's assume for now the hook might not return a global error string, but we can verify.
  // If the file is invalid (not excel), the hook might not catch it or we do it here.
  
  // Let's implement local validation before calling onFileSelect
  const [localError, setLocalError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      
      // Validate file type
      const validExtensions = ['.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setLocalError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setLocalError('File exceeds 10MB limit. Please upload a smaller file.');
        return;
      }

      await onFileSelect(file);
    },
    [onFileSelect]
  );
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  // We don't need a manual "Next" button enabled/disabled logic here as much 
  // because the parent page auto-advances when rows are present.
  // But we can keep it if we want manual control.
  // For now, let's keep the UI similar.

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              Import Test Configuration
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
              Upload your master data spreadsheet to initialize the test parameters.
            </p>
          </div>

          {/* Upload zone */}
          <div
            className={cn(
              'group relative rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-300',
              isParsing && 'pointer-events-none',
              isDragging
                ? 'border-indigo-400 bg-indigo-50/60 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-soft'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 z-10 w-full h-full opacity-0"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isParsing}
            />

            <div className="flex flex-col items-center justify-center">
              {/* Icon */}
              <div
                className={cn(
                  'mb-6 rounded-2xl p-5 transition-all duration-300',
                  isDragging
                    ? 'bg-indigo-100 text-indigo-600 scale-110'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100/80 group-hover:text-indigo-500'
                )}
              >
                {isParsing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 transition-transform duration-300 group-hover:-translate-y-1" />
                )}
              </div>

              {isParsing ? (
                <>
                  <h3 className="text-lg font-semibold text-slate-900">Parsing spreadsheet...</h3>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isDragging ? 'Drop your file here' : 'Upload your configuration file'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm">
                    Drag and drop your Excel file here, or click to browse.
                  </p>
                  <div className="mt-5 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Supports .xlsx and .xls files up to 10MB</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error state */}
          {(localError || parseError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 animate-slide-up shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Upload Failed</h4>
                <div className="text-sm text-red-700 mt-0.5 whitespace-pre-wrap">{localError || parseError}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
