'use client';

import { toast } from 'sonner';

import type { LoginResult } from '@/actions/user';
import { getSessionUser, loginUser, logoutUser } from '@/actions/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════
   useLogin / useLogout / useSessionUser —
   React Query hooks for iron-session auth.
   ═══════════════════════════════════════════════════════ */

const SESSION_KEY = ['session-user'] as const;

/**
 * Mutation hook for logging in.
 * Invalidates the session query on success.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResult, Error, { username: string; password: string }>({
    mutationFn: ({ username, password }) => loginUser(username, password),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Logged in successfully');
        queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      } else {
        toast.error(result.error || 'Login failed');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'An unexpected error occurred');
    },
  });
}

/**
 * Mutation hook for logging out.
 * Invalidates the session query after logout.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      toast.success('Logged out successfully');
      queryClient.invalidateQueries({ queryKey: SESSION_KEY });
    },
  });
}

/**
 * Query hook to fetch the current session user.
 * Returns null when not logged in.
 */
export function useSessionUser() {
  const { data, isLoading, isError } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => getSessionUser(),
    staleTime: 60_000, // Cache for 1 minute
  });

  return {
    user: data ?? null,
    isLoading,
    isLoggedIn: !!data,
    isError,
  };
}
