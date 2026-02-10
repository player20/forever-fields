// ======================
// PostHog Client Configuration
// ======================

import posthog from "posthog-js";
import { IS_PRODUCTION, DEMO_MODE } from "@/lib/constants";

let isInitialized = false;

/**
 * Initialize PostHog for client-side analytics and feature flags
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (isInitialized) return;
  if (DEMO_MODE) return; // Don't track in demo mode

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!posthogKey) {
    if (!IS_PRODUCTION) {
      console.log("[PostHog] No API key configured, skipping initialization");
    }
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ["click", "submit"],
      element_allowlist: ["button", "a", "form"],
    },
    // Feature flags configuration
    bootstrap: {
      featureFlags: {}, // Will be populated from server
    },
    loaded: (ph) => {
      // Enable debug mode in development
      if (!IS_PRODUCTION) {
        ph.debug();
      }
    },
  });

  isInitialized = true;
}

/**
 * Identify a user in PostHog
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (!isInitialized || DEMO_MODE) return;

  posthog.identify(userId, {
    ...properties,
    $set_once: {
      first_seen: new Date().toISOString(),
    },
  });
}

/**
 * Reset the user session (on logout)
 */
export function resetUser(): void {
  if (!isInitialized || DEMO_MODE) return;
  posthog.reset();
}

/**
 * Capture a custom event
 */
export function captureEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isInitialized || DEMO_MODE) return;
  posthog.capture(eventName, properties);
}

/**
 * Capture a pageview
 */
export function capturePageview(url: string): void {
  if (!isInitialized || DEMO_MODE) return;
  posthog.capture("$pageview", { $current_url: url });
}

/**
 * Get a feature flag value
 */
export function getFeatureFlag(
  flagKey: string,
  defaultValue: boolean | string = false
): boolean | string {
  if (!isInitialized || DEMO_MODE) return defaultValue;
  return posthog.getFeatureFlag(flagKey) ?? defaultValue;
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isInitialized || DEMO_MODE) return false;
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get experiment variant
 */
export function getExperimentVariant(experimentKey: string): string | undefined {
  if (!isInitialized || DEMO_MODE) return undefined;
  const variant = posthog.getFeatureFlag(experimentKey);
  return typeof variant === "string" ? variant : undefined;
}

/**
 * Reload feature flags (useful after user properties change)
 */
export function reloadFeatureFlags(): void {
  if (!isInitialized || DEMO_MODE) return;
  posthog.reloadFeatureFlags();
}

// Export the posthog instance for advanced usage
export { posthog };
