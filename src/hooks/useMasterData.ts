'use client';

import {
    createManyMasterData,
    createMasterData,
    getAllMasterData,
    getMasterData,
} from '@/actions/master-data';
import type { MasterDataInput, MasterDataRow } from '@/types/test-session';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useMasterData — React Query hooks for the MasterData table.
   Includes queries for fetching and mutations for creating.
   ═══════════════════════════════════════════════════════ */

export const MASTER_DATA_KEYS = {
  all: ['master-data'] as const,
  latest: ['master-data', 'latest'] as const,
  list: ['master-data', 'list'] as const,
};

/**
 * Hook to fetch the latest MasterData row.
 */
export function useMasterData() {
  const { data, isLoading, isError, error, refetch } = useQuery<MasterDataRow | null>({
    queryKey: MASTER_DATA_KEYS.latest,
    queryFn: () => getMasterData(),
  });

  return {
    masterData: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to fetch all MasterData rows.
 */
export function useAllMasterData() {
  const { data, isLoading, isError, error, refetch } = useQuery<MasterDataRow[]>({
    queryKey: MASTER_DATA_KEYS.list,
    queryFn: () => getAllMasterData(),
  });

  return {
    allMasterData: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to create a single MasterData row.
 */
export function useCreateMasterData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MasterDataInput) => createMasterData(data),
    onSuccess: () => {
      // Invalidate both lists and the latest query
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.all });
    },
  });
}

/**
 * Hook to create multiple MasterData rows (bulk insert).
 */
export function useCreateManyMasterData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MasterDataInput[]) => createManyMasterData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_DATA_KEYS.all });
    },
  });
}
