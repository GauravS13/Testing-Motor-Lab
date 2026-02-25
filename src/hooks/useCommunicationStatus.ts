'use client';

import type { CommunicationStatusData } from '@/actions/communication-status';
import { getCommunicationStatus } from '@/actions/communication-status';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useCommunicationStatus — React Query hook for the
   CommunicationStatus table.
   ═══════════════════════════════════════════════════════ */

const QUERY_KEY = ['communication-status'] as const;

/**
 * Fetches the latest communication status from the database.
 *
 * @param refetchInterval — auto-refetch interval in ms (default: disabled).
 *   Set to e.g. `3000` for 3-second polling.
 */
export function useCommunicationStatus(refetchInterval?: number | false) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<CommunicationStatusData | null>({
      queryKey: QUERY_KEY,
      queryFn: () => getCommunicationStatus(),
      refetchInterval: refetchInterval ?? false,
      staleTime: 5_000,
    });

  return {
    communicationStatus: data ?? null,
    isLoading,
    isFetching,
    isError,
    error: isError ? (error?.message ?? 'Failed to fetch communication status') : null,
    refetch,
  };
}
