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
            staleTime: 1000 * 30, // fresh window
            gcTime: 1000 * 60 * 5, // garbage collection time
            refetchOnWindowFocus: true,
            retry: (failureCount, error: any) => {
              // don't retry on 401/403/404 client errors
              if (error?.message?.includes('not found') || error?.message?.includes('unauthorized') || error?.message?.includes('forbidden')) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
