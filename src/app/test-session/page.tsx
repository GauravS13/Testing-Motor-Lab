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
   /test-session — Multi-step wizard page.
   
   This is the primary entry point after login.
   Orchestrates: Upload → Review → Testing.
   Now uses useExcelUpload for the robust import workflow.
   ═══════════════════════════════════════════════════════ */

export default function TestSessionPage() {
  const { currentStep, completedSteps, goToStep, completeStep } = useTestSessionStore();
  
  // Use our new robust hook for the upload/review phase
  const {
      parsedRows,
      isParsing,
      parseFile,
      updateRowStatus,
      removeRow,
      updateRowData,
      sync,
      retry,
      reset: resetUpload // Alias to avoid confusion if we used store reset here
  } = useExcelUpload();

  // Auto-advance to review if rows are parsed
  useEffect(() => {
      if (parsedRows.length > 0 && currentStep === 'upload') {
          completeStep('upload');
          goToStep('review');
      }
  }, [parsedRows.length, currentStep, goToStep, completeStep]);

  // Hydration check to prevent mismatches with persisted store
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null; // or a loading spinner

  return (
    <AppShell activeTab="Testing">
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
                    // Sync the reviewed data to the global store for the Testing Step
                    // We need to map from ParsedRow (with MasterDataInput numbers) to TestRecord (strings)
                    const recordsToPersist = parsedRows.map((row, idx) => ({
                        id: String(idx), /// stable id based on index for this session
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

                    // We use a direct set action or update via setParsedData
                    // But setParsedData also sets step to 'review' which conflicts.
                    // So we might need to use a new action or just manually set it if possible, 
                    // or use setParsedData then override step?
                    // Actually setParsedData sets step to review.
                    // Let's use it, and then complete review and go to testing.
                    
                    // Actually, let's look at store. setParsedData sets currentStep = 'review'.
                    // We want to go to 'testing'.
                    // I should probably add a dedicated action for this in the store, 
                    // OR just rely on the fact that I call completeStep('review') and goToStep('testing') immediately after.
                    
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
