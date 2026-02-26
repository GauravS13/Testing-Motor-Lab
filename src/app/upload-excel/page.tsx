'use client';

import { AppShell } from '@/components/layout/app-shell';
import { DataReviewStep } from '@/components/test-session/DataReviewStep';
import { StepperHeader } from '@/components/test-session/StepperHeader';
import { TestingStep } from '@/components/test-session/TestingStep';
import { UploadStep } from '@/components/test-session/UploadStep';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { useTestSessionStore } from '@/store/test-session';
import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════
   /upload-excel — Upload & sync master data from Excel.
   
   Full 3-step stepper (Upload → Review → Testing).
   The Testing step is rendered INLINE within this page,
   separate from the standalone /testing page.
   ═══════════════════════════════════════════════════════ */

export default function UploadExcelPage() {
  const { currentStep, completedSteps, goToStep, completeStep, reset: resetStore } = useTestSessionStore();

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
            onNext={() => {
              // Map parsed rows to TestRecord format for the Testing Step
              const recordsToPersist = parsedRows.map((row, idx) => ({
                id: String(idx),
                srNo: Number(row.data.srNo) || 0,
                model: row.data.model || '',
                phase: String(row.data.phase || ''),
                minInsulationRes: String(row.data.minInsulationRes || ''),
                maxInsulationRes: String(row.data.maxInsulationRes || ''),
                testTime: String(row.data.testTime || ''),
                minVoltage: String(row.data.minVoltage || ''),
                maxVoltage: String(row.data.maxVoltage || ''),
                minCurrent: String(row.data.minCurrent || ''),
                maxCurrent: String(row.data.maxCurrent || ''),
                minPower: String(row.data.minPower || ''),
                maxPower: String(row.data.maxPower || ''),
                minFrequency: String(row.data.minFrequency || ''),
                maxFrequency: String(row.data.maxFrequency || ''),
                minRPM: String(row.data.minRPM || ''),
                maxRPM: String(row.data.maxRPM || ''),
                direction: String(row.data.direction || ''),
              }));

              useTestSessionStore.getState().setParsedData(recordsToPersist, parsedRows.length, 0);
              completeStep('review');
              goToStep('testing');
            }}
          />
        )}

        {currentStep === 'testing' && <TestingStep />}
      </div>
    </AppShell>
  );
}
