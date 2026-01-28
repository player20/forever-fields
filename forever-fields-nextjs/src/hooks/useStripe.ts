// Stripe client-side hook

"use client";

import { useState, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { STRIPE_PUBLIC_KEY, SUBSCRIPTION_TIERS, ONE_TIME_PRODUCTS } from "@/lib/stripe/client-config";
import type { SubscriptionTier, OneTimeProduct } from "@/lib/stripe/client-config";

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  if (!stripePromise && STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

// Hook state
interface UseStripeState {
  isLoading: boolean;
  error: string | null;
}

// Hook return type
interface UseStripeReturn extends UseStripeState {
  // Checkout functions
  startSubscriptionCheckout: (
    tier: SubscriptionTier,
    options?: { trialDays?: number }
  ) => Promise<void>;
  startOneTimeCheckout: (product: OneTimeProduct) => Promise<void>;

  // Portal
  openCustomerPortal: () => Promise<void>;

  // Utilities
  getTierInfo: (tier: SubscriptionTier) => (typeof SUBSCRIPTION_TIERS)[SubscriptionTier];
  getProductInfo: (product: OneTimeProduct) => (typeof ONE_TIME_PRODUCTS)[OneTimeProduct];
  clearError: () => void;
}

export function useStripe(userId?: string, email?: string, name?: string): UseStripeReturn {
  const [state, setState] = useState<UseStripeState>({
    isLoading: false,
    error: null,
  });

  // Start subscription checkout
  const startSubscriptionCheckout = useCallback(
    async (tier: SubscriptionTier, options?: { trialDays?: number }) => {
      if (!userId || !email) {
        setState((s) => ({ ...s, error: "User not authenticated" }));
        return;
      }

      setState({ isLoading: true, error: null });

      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            name,
            type: "subscription",
            tier,
            trialDays: options?.trialDays,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Checkout failed");
        }

        const { url } = await response.json();

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        setState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Checkout failed",
        });
      }
    },
    [userId, email, name]
  );

  // Start one-time purchase checkout
  const startOneTimeCheckout = useCallback(
    async (product: OneTimeProduct) => {
      if (!userId || !email) {
        setState((s) => ({ ...s, error: "User not authenticated" }));
        return;
      }

      setState({ isLoading: true, error: null });

      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            name,
            type: "one-time",
            product,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Checkout failed");
        }

        const { url } = await response.json();

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        setState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Checkout failed",
        });
      }
    },
    [userId, email, name]
  );

  // Open customer portal
  const openCustomerPortal = useCallback(async () => {
    if (!userId || !email) {
      setState((s) => ({ ...s, error: "User not authenticated" }));
      return;
    }

    setState({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to open portal");
      }

      const { url } = await response.json();

      // Redirect to Customer Portal
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to open portal",
      });
    }
  }, [userId, email, name]);

  // Get tier information
  const getTierInfo = useCallback((tier: SubscriptionTier) => {
    return SUBSCRIPTION_TIERS[tier];
  }, []);

  // Get product information
  const getProductInfo = useCallback((product: OneTimeProduct) => {
    return ONE_TIME_PRODUCTS[product];
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    ...state,
    startSubscriptionCheckout,
    startOneTimeCheckout,
    openCustomerPortal,
    getTierInfo,
    getProductInfo,
    clearError,
  };
}

// Export Stripe instance getter
export { getStripe };

// Export types for convenience
export type { SubscriptionTier, OneTimeProduct };
