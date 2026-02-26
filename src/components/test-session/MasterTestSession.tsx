'use client';

import { useAllTestedData } from '@/hooks/useTestedData';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TestSessionInterface, TestSessionRecord } from './TestSessionInterface';
import { TestSessionSummary } from './TestSessionSummary';

interface MasterTestSessionProps {
  records: TestSessionRecord[];
}

export function MasterTestSession({ records }: MasterTestSessionProps) {
  const router = useRouter();
  
  // Local state for submitted records in this session
  // Since this is a direct master data test, we don't persist to the wizard store.
  const [submittedIds, setSubmittedIds] = useState<(string | number)[]>([]);
  
  const { allTestedData, isLoading: loadingStats, refetch: refetchStats } = useAllTestedData();

  const handleMarkAsSubmitted = (id: string | number) => {
    setSubmittedIds(prev => [...prev, id]);
    // Refetch stats to update the table immediately
    refetchStats(); 
  };

  const handleComplete = () => {
    // For now, just refresh or go to results? 
    // Since there's no "session" object to clear, maybe just go to results 
    // or reload to clear the "submitted" state?
    // User said "this testing page will be the default page".
    // Let's redirect to results.
    router.push('/results');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-hidden flex flex-col">
        <TestSessionInterface 
            records={records}
            submittedRecordIds={submittedIds}
            onMarkAsSubmitted={handleMarkAsSubmitted}
            onComplete={handleComplete}
            backLabel="" 
            completeLabel="Finish Testing"
            footer={<TestSessionSummary data={allTestedData} loading={loadingStats} />}
            isTestingPage={true}
        />
      </div>
    </div>
  );
}
