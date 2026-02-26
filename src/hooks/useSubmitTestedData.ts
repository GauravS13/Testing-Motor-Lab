'use client';

import { getSubmitTestedData } from '@/actions/submit-tested-data';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useSubmitTestedData — React Query hook for polling
   the SubmitTestedData flag table every 5 seconds.
   ═══════════════════════════════════════════════════════ */

export const SUBMIT_TESTED_DATA_KEYS = {
  flag: ['submit-tested-data'] as const,
};

/**
 * Polls the SubmitTestedData table for the IsSubmited flag.
 * @param enabled — pass `false` to disable polling entirely.
 */
export function useSubmitTestedData(enabled: boolean = true) {
  const { data, isLoading, isError, error } = useQuery<number>({
    queryKey: SUBMIT_TESTED_DATA_KEYS.flag,
    queryFn: () => getSubmitTestedData(),
    refetchInterval: enabled ? 5000 : false,
    enabled,
  });

  return {
    isSubmited: data ?? 0,
    isLoading,
    isError,
    error: isError ? (error?.message ?? 'Failed to fetch submit flag') : null,
  };
}
