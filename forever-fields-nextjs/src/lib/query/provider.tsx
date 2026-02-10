"use client";

// ======================
// React Query Provider
// ======================

import { useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const defaultOptions = {
  queries: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: false,
  },
};

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
