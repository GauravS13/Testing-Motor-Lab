'use client';

import type { RealTimeDataRow } from '@/actions/real-time-data';
import { getRealTimeData } from '@/actions/real-time-data';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useRealTimeData — React Query hook for the
   RealTimeData table.
   ═══════════════════════════════════════════════════════ */

const QUERY_KEY = ['real-time-data'] as const;

/**
 * Fetches the latest real-time instrument data from the database.
 *
 * @param refetchInterval — auto-refetch interval in ms (default: disabled).
 *   Set to e.g. `3000` for 3-second polling.
 */
export function useRealTimeData(
  refetchInterval?: number | false | ((data: RealTimeDataRow | null | undefined) => number | false)
) {
  const { data, isLoading, isError, error, refetch, isFetching, isFetched } =
    useQuery<RealTimeDataRow | null>({
      queryKey: QUERY_KEY,
      queryFn: () => getRealTimeData(),
      refetchInterval: (query) => {
        if (typeof refetchInterval === 'function') {
          return refetchInterval(query.state.data);
        }
        return refetchInterval ?? false;
      }
    });
    

  return {
    realTimeData: data ?? null,
    isLoading,
    isFetching,
    isError,
    error: isError ? (error?.message ?? 'Failed to fetch real-time data') : null,
    refetch,
    isFetched
  };
}
