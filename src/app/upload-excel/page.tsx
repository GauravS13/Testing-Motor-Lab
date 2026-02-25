'use client';

import { AppShell } from '@/components/layout/app-shell';
import { DataReviewStep } from '@/components/test-session/DataReviewStep';
import { StepperHeader } from '@/components/test-session/StepperHeader';
import { UploadStep } from '@/components/test-session/UploadStep';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { useTestSessionStore } from '@/store/test-session';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════
   /upload-excel — Upload & sync master data from Excel.
   
   Reuses the same stepper workflow as /test-session
   (Upload → Review → Testing).
   ═══════════════════════════════════════════════════════ */

export default function UploadExcelPage() {
  const { currentStep, completedSteps, goToStep, completeStep, reset: resetStore } = useTestSessionStore();
  const router = useRouter();

  // Reset store on mount so stale stepper state doesn't persist across navigations
  useEffect(() => {
    resetStore();
  }, [resetStore]);

  const {
    parsedRows,
    isParsing,
    parseFile,
    removeRow,
    updateRowData,
    sync,
    retry,
    reset: resetUpload,
  } = useExcelUpload();

  // Auto-advance to review when rows are parsed
  useEffect(() => {
    if (parsedRows.length > 0 && currentStep === 'upload') {
      completeStep('upload');
      goToStep('review');
    }
  }, [parsedRows.length, currentStep, goToStep, completeStep]);

  // Hydration check for persisted store
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  return (
    <AppShell activeTab="Upload Excel">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Stepper ── */}
        <StepperHeader
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />

        {/* ── Active Step ── */}
        {currentStep === 'upload' && (
          <UploadStep
            onFileSelect={parseFile}
            isParsing={isParsing}
          />
        )}

        {currentStep === 'review' && (
          <DataReviewStep
            rows={parsedRows}
            onRetry={retry}
            onDelete={removeRow}
            onSync={() => sync(parsedRows)}
            onUpdateRecord={updateRowData}
            onDiscard={resetUpload}
            onNext={() => router.push('/testing')}
          />
        )}
      </div>
    </AppShell>
  );
}
