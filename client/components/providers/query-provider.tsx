// tanstack react-query client provider with optimal caching and polling defaults
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 45, // 45s fresh window to avoid excessive mobile re-fetches
            gcTime: 1000 * 60 * 10, // 10m garbage collection time
            refetchOnWindowFocus: false, // Don't trigger refetch flood when user unlocks phone or switches tabs
            networkMode: 'offlineFirst', // Return cached response immediately on flaky mobile connections
            retry: (failureCount, error: any) => {
              // don't retry on 401/403/404 client errors
              if (
                error?.message?.includes('not found') ||
                error?.message?.includes('unauthorized') ||
                error?.message?.includes('forbidden')
              ) {
                return false;
              }
              return failureCount < 1; // Retry once on network hiccup
            },
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
