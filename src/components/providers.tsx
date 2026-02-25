'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   Providers — App-level context wrappers.

   Currently wraps:
   • TanStack React Query — for data fetching, caching,
     and background refetching of live data.
   ═══════════════════════════════════════════════════════ */

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,       // Data considered fresh for 5s
            refetchOnWindowFocus: true, // Re-fetch when user tabs back
            retry: 2,                  // Retry failed requests twice
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
