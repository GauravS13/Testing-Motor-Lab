'use client';

import { useTestSessionStore } from '@/store/test-session';
import { useRouter } from 'next/navigation';
import { TestSessionInterface, TestSessionRecord } from './TestSessionInterface';

/* ═══════════════════════════════════════════════════════
   TestingStep — Step 3 of the test workflow wizard.
   
   Refactored to use the reusable TestSessionInterface.
   ═══════════════════════════════════════════════════════ */

export function TestingStep() {
  const { 
    goToStep, 
    parsedRecords, 
    submittedRecordIds, 
    markRecordAsSubmitted, 
    reset 
  } = useTestSessionStore();
  
  const router = useRouter();

  const handleCompleteSession = () => {
      // Clear store
      reset();
      router.push('/results');
  };

  // parsedRecords are already compatible with TestSessionRecord, 
  // but let's cast to be safe or map if necessary.
  // TestRecord has id: string, TestSessionRecord has id: string | number. Compatible.
  // TestRecord values are strings. TestSessionInterface handles strings.

  return (
    <TestSessionInterface 
        records={parsedRecords as unknown as TestSessionRecord[]}
        submittedRecordIds={submittedRecordIds}
        onMarkAsSubmitted={(id) => markRecordAsSubmitted(String(id))}
        onComplete={handleCompleteSession}
        onBack={() => goToStep('review')}
        backLabel="Back to Review"
    />
  );
}
