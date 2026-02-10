"use client";

// ======================
// Feature Flags System
// Centralized feature flag definitions and hooks
// ======================

import { useCallback, useEffect, useState } from "react";
import { isFeatureEnabled, getExperimentVariant, captureEvent } from "@/lib/posthog";
import { useAuth } from "@/hooks/useAuth";
import { tierMeetsRequirement, DEMO_MODE, type SubscriptionTier } from "@/lib/constants";

// ======================
// Feature Flag Definitions
// ======================

export const FEATURE_FLAGS = {
  // Experiments (A/B tests)
  "experiment-new-memorial-flow": {
    description: "Test new memorial creation flow",
    default: false,
    type: "experiment" as const,
  },
  "experiment-ai-suggestions": {
    description: "Test AI-powered suggestions in obituary editor",
    default: false,
    type: "experiment" as const,
  },
  "experiment-simplified-pricing": {
    description: "Test simplified pricing page",
    default: false,
    type: "experiment" as const,
  },
  "experiment-home-layout": {
    description: "Test home page layout variations",
    default: false,
    type: "experiment" as const,
  },
  "experiment-create-flow": {
    description: "Test memorial creation flow variations",
    default: false,
    type: "experiment" as const,
  },
  "experiment-memorial-layout": {
    description: "Test memorial view layout variations",
    default: false,
    type: "experiment" as const,
  },

  // Gradual rollouts
  "feature-voice-cloning-v2": {
    description: "New voice cloning engine",
    default: false,
    type: "rollout" as const,
    tierRequired: "heritage" as SubscriptionTier,
  },
  "feature-cemetery-map-3d": {
    description: "3D cemetery map visualization",
    default: false,
    type: "rollout" as const,
  },
  "feature-time-capsule-video": {
    description: "Video messages in time capsules",
    default: false,
    type: "rollout" as const,
    tierRequired: "remember" as SubscriptionTier,
  },
  "feature-collaborative-editing": {
    description: "Real-time collaborative memorial editing",
    default: false,
    type: "rollout" as const,
    tierRequired: "heritage" as SubscriptionTier,
  },

  // Tier-gated features (always check tier first)
  "tier-ai-assistant": {
    description: "AI memorial assistant",
    default: false,
    type: "tier" as const,
    tierRequired: "remember" as SubscriptionTier,
  },
  "tier-voice-cloning": {
    description: "Voice cloning feature",
    default: false,
    type: "tier" as const,
    tierRequired: "heritage" as SubscriptionTier,
  },
  "tier-unlimited-storage": {
    description: "Unlimited photo/video storage",
    default: false,
    type: "tier" as const,
    tierRequired: "legacy" as SubscriptionTier,
  },

  // Operational flags
  "ops-maintenance-mode": {
    description: "Enable maintenance mode",
    default: false,
    type: "ops" as const,
  },
  "ops-disable-ai": {
    description: "Disable AI features (for cost control)",
    default: false,
    type: "ops" as const,
  },
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

// ======================
// Feature Flag Hook
// ======================

interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  variant?: string;
}

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): UseFeatureFlagResult {
  const { user, isLoading: authLoading } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;

    const config = FEATURE_FLAGS[flag];

    // In demo mode, use default values
    if (DEMO_MODE) {
      setEnabled(config.default);
      setLoading(false);
      return;
    }

    // Check tier requirement first
    if ("tierRequired" in config && config.tierRequired) {
      if (!tierMeetsRequirement(user?.subscriptionTier, config.tierRequired)) {
        setEnabled(false);
        setLoading(false);
        return;
      }
    }

    // Get flag value from PostHog
    const flagEnabled = isFeatureEnabled(flag);
    setEnabled(flagEnabled || config.default);
    setLoading(false);
  }, [flag, user, authLoading]);

  return { enabled, loading };
}

/**
 * Hook for A/B experiments with variant tracking
 */
export function useExperiment(experimentKey: FeatureFlag): {
  variant: string;
  loading: boolean;
  track: (event: string, properties?: Record<string, unknown>) => void;
} {
  const { isLoading: authLoading } = useAuth();
  const [variant, setVariant] = useState<string>("control");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;

    // Check for URL override (for local testing: ?variant=simplified)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVariant = urlParams.get("variant");
      if (urlVariant) {
        setVariant(urlVariant);
        setLoading(false);
        return;
      }
    }

    // In demo mode, always return control
    if (DEMO_MODE) {
      setVariant("control");
      setLoading(false);
      return;
    }

    const experimentVariant = getExperimentVariant(experimentKey);
    setVariant(experimentVariant || "control");
    setLoading(false);
  }, [experimentKey, authLoading]);

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      captureEvent(event, {
        experiment: experimentKey,
        variant,
        ...properties,
      });
    },
    [experimentKey, variant]
  );

  return { variant, loading, track };
}

// ======================
// Feature Gate Component
// ======================

interface FeatureGateProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render based on feature flag
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return null; // Or a loading skeleton
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
}

// ======================
// Experiment Component
// ======================

interface ExperimentProps {
  experimentKey: FeatureFlag;
  variants: Record<string, React.ReactNode>;
  defaultVariant?: string;
}

/**
 * Component for A/B test rendering
 */
export function Experiment({
  experimentKey,
  variants,
  defaultVariant = "control",
}: ExperimentProps) {
  const { variant, loading } = useExperiment(experimentKey);

  if (loading) {
    return null;
  }

  return <>{variants[variant] || variants[defaultVariant] || null}</>;
}
