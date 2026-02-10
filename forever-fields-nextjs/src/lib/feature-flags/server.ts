// ======================
// Server-side Feature Flags
// ======================

import { FEATURE_FLAGS, type FeatureFlag } from "./index";
import { tierMeetsRequirement, DEMO_MODE, type SubscriptionTier } from "@/lib/constants";

/**
 * Get feature flag value on the server
 * Uses PostHog Node SDK for server-side evaluation
 */
export async function getServerFeatureFlag(
  flag: FeatureFlag,
  userId?: string,
  userProperties?: Record<string, unknown>
): Promise<boolean> {
  const config = FEATURE_FLAGS[flag];

  // Check tier requirement if user properties include subscription tier
  if ("tierRequired" in config && config.tierRequired && userProperties?.subscriptionTier) {
    if (!tierMeetsRequirement(userProperties.subscriptionTier as SubscriptionTier, config.tierRequired)) {
      return false;
    }
  }

  // In demo mode or if no PostHog key, use default
  if (DEMO_MODE || !process.env.POSTHOG_API_KEY) {
    return config.default;
  }

  try {
    const { PostHog } = await import("posthog-node");
    const client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    });

    // Convert userProperties to string values for PostHog
    const stringProperties: Record<string, string> | undefined = userProperties
      ? Object.fromEntries(
          Object.entries(userProperties).map(([k, v]) => [k, String(v)])
        )
      : undefined;

    const result = await client.isFeatureEnabled(flag, userId || "anonymous", {
      personProperties: stringProperties,
    });

    await client.shutdown();

    return result ?? config.default;
  } catch (error) {
    console.error(`[FeatureFlags] Error checking flag ${flag}:`, error);
    return config.default;
  }
}
