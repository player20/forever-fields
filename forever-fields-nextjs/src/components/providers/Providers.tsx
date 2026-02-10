"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { PostHogProvider } from "@/lib/posthog";
import { QueryProvider } from "@/lib/query";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <PostHogProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PostHogProvider>
    </QueryProvider>
  );
}
