'use client';

import {
    createManyTestedData,
    createTestedData,
    getAllTestedData,
    getTestedData,
} from '@/actions/tested-data';
import type { TestedDataInput, TestedDataRow } from '@/types/test-session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useTestedData — React Query hooks for the TestedData table.
   Includes queries for fetching and mutations for creating.
   ═══════════════════════════════════════════════════════ */

export const TESTED_DATA_KEYS = {
  all: ['tested-data'] as const,
  latest: ['tested-data', 'latest'] as const,
  list: ['tested-data', 'list'] as const,
};

/**
 * Hook to fetch the latest TestedData row.
 */
export function useTestedData() {
  const { data, isLoading, isError, error, refetch } = useQuery<TestedDataRow | null>({
    queryKey: TESTED_DATA_KEYS.latest,
    queryFn: () => getTestedData(),
  });

  return {
    testedData: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to fetch all TestedData rows.
 */
export function useAllTestedData() {
  const { data, isLoading, isError, error, refetch } = useQuery<TestedDataRow[]>({
    queryKey: TESTED_DATA_KEYS.list,
    queryFn: () => getAllTestedData(),
  });

  return {
    allTestedData: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to create a single TestedData row.
 */
export function useCreateTestedData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TestedDataInput) => createTestedData(data),
    onSuccess: () => {
      // Invalidate both lists and the latest query
      queryClient.invalidateQueries({ queryKey: TESTED_DATA_KEYS.all });
    },
  });
}

/**
 * Hook to create multiple TestedData rows (bulk insert).
 */
export function useCreateManyTestedData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TestedDataInput[]) => createManyTestedData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTED_DATA_KEYS.all });
    },
  });
}
