// Stripe checkout API endpoint

import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateCustomer,
  createSubscriptionCheckout,
  createOneTimeCheckout,
  SUBSCRIPTION_TIERS,
  ONE_TIME_PRODUCTS,
  buildSuccessUrl,
} from "@/lib/stripe";
import { requireAuth } from "@/lib/supabase/server";
import type { SubscriptionTier, OneTimeProduct } from "@/lib/stripe";

// POST /api/stripe/checkout - Create checkout session
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, tier, product, trialDays } = body;

    // Get or create Stripe customer using authenticated user
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name || user.user_metadata?.first_name
    );

    // Build URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = buildSuccessUrl(`${origin}/subscription/success`);
    const cancelUrl = `${origin}/pricing`;

    let session;

    if (type === "subscription") {
      // Validate tier
      if (!tier || !SUBSCRIPTION_TIERS[tier as SubscriptionTier]) {
        return NextResponse.json(
          { error: "Invalid subscription tier" },
          { status: 400 }
        );
      }

      session = await createSubscriptionCheckout(
        customerId,
        tier as SubscriptionTier,
        successUrl,
        cancelUrl,
        {
          trialDays,
          allowPromotionCodes: true,
          metadata: {
            userId: user.id,
            tier,
          },
        }
      );
    } else if (type === "one-time") {
      // Validate product
      if (!product || !ONE_TIME_PRODUCTS[product as OneTimeProduct]) {
        return NextResponse.json(
          { error: "Invalid product" },
          { status: 400 }
        );
      }

      session = await createOneTimeCheckout(
        customerId,
        product as OneTimeProduct,
        successUrl,
        cancelUrl,
        {
          allowPromotionCodes: true,
          metadata: {
            userId: user.id,
            product,
          },
        }
      );
    } else {
      return NextResponse.json(
        { error: "type must be 'subscription' or 'one-time'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
