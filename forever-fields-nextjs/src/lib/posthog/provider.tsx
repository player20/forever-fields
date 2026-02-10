"use client";

// ======================
// PostHog Provider
// Wraps the app with PostHog tracking
// ======================

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, capturePageview } from "./client";

interface PostHogProviderProps {
  children: React.ReactNode;
}

// Inner component that uses searchParams (requires Suspense boundary)
function PostHogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageviews
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      capturePageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: PostHogProviderProps) {

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogTracker />
      </Suspense>
      {children}
    </>
  );
}
