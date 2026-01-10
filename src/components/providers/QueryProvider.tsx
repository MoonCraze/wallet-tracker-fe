"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query provider with optimized default options
 * Provides caching, deduplication, and background refetching for API calls
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance with useState to ensure it's only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Cache is garbage collected after 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests up to 3 times
            retry: 3,
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus (good for dashboards)
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect automatically
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
