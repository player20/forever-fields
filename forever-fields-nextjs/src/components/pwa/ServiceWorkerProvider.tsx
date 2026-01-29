"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/sw-register";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export function ServiceWorkerProvider() {
  useEffect(() => {
    // Register service worker on mount
    if (process.env.NODE_ENV === "production") {
      registerServiceWorker();
    }
  }, []);

  return <OfflineIndicator />;
}
