'use client';

import {
  getAllLiveTestingData,
  getLiveTestingData,
} from '@/actions/live-testing-data';
import type { LiveTestingDataRow } from '@/types/test-session';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useLiveTestingData — React Query hooks for the
   LiveTestingData table.
   ═══════════════════════════════════════════════════════ */

export const LIVE_TESTING_DATA_KEYS = {
  all: ['live-testing-data'] as const,
  latest: ['live-testing-data', 'latest'] as const,
  list: ['live-testing-data', 'list'] as const,
};

/**
 * Hook to fetch the latest LiveTestingData row.
 *
 * @param refetchInterval — auto-refetch interval in ms (default: disabled).
 *   Set to e.g. `3000` for 3-second polling during live testing.
 */
export function useLiveTestingData(refetchInterval?: number | false) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<LiveTestingDataRow | null>({
      queryKey: LIVE_TESTING_DATA_KEYS.latest,
      queryFn: () => getLiveTestingData(),
      refetchInterval: refetchInterval ?? false,
    });

  return {
    liveTestingData: data ?? null,
    isLoading,
    isFetching,
    isError,
    error: isError ? (error?.message ?? 'Failed to fetch live testing data') : null,
    refetch,
  };
}

/**
 * Hook to fetch all LiveTestingData rows.
 */
export function useAllLiveTestingData() {
  const { data, isLoading, isError, error, refetch } =
    useQuery<LiveTestingDataRow[]>({
      queryKey: LIVE_TESTING_DATA_KEYS.list,
      queryFn: () => getAllLiveTestingData(),
    });

  return {
    allLiveTestingData: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
