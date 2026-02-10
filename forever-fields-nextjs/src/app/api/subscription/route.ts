/**
 * Subscription API
 *
 * Get and manage the current user's subscription.
 *
 * Endpoints:
 * - GET  /api/subscription - Get current subscription and invoices
 * - POST /api/subscription - Update subscription (change plan)
 *
 * @module api/subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import {
  getOrCreateCustomer,
  getActiveSubscription,
  getSubscriptionInvoices,
  updateSubscription,
  type UserSubscription,
} from "@/lib/stripe/subscriptions";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe/client-config";
import type { SubscriptionTier } from "@/lib/stripe/client-config";

// Demo subscription data
const demoSubscription: UserSubscription = {
  id: "sub_demo_123",
  status: "active",
  tier: "heritage" as SubscriptionTier,
  currentPeriodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
  currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // 15 days from now
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEnd: null,
};

const demoInvoices = [
  {
    id: "inv_demo_1",
    number: "INV-001",
    status: "paid",
    amount: 1900, // $19.00 in cents
    currency: "usd",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    pdfUrl: null,
  },
  {
    id: "inv_demo_2",
    number: "INV-002",
    status: "paid",
    amount: 1900,
    currency: "usd",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    pdfUrl: null,
  },
];

// GET /api/subscription - Get current subscription
export async function GET() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      subscription: demoSubscription,
      invoices: demoInvoices,
      tier: SUBSCRIPTION_TIERS[demoSubscription.tier],
    });
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email || "",
      user.user_metadata?.full_name
    );

    // Get subscription and invoices
    const subscription = await getActiveSubscription(customerId);
    const invoices = await getSubscriptionInvoices(customerId, 12);

    return NextResponse.json({
      subscription,
      invoices,
      tier: subscription ? SUBSCRIPTION_TIERS[subscription.tier] : SUBSCRIPTION_TIERS.free,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

// POST /api/subscription - Update subscription (change plan)
export async function POST(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { newTier } = body as { newTier: SubscriptionTier };

    if (!newTier || !SUBSCRIPTION_TIERS[newTier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (DEMO_MODE) {
      return NextResponse.json({
        success: true,
        message: `Plan changed to ${SUBSCRIPTION_TIERS[newTier].name}`,
      });
    }

    // Get customer and subscription
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email || "",
      user.user_metadata?.full_name
    );

    const subscription = await getActiveSubscription(customerId);

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Get the new price ID
    const tierConfig = SUBSCRIPTION_TIERS[newTier];
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: "Cannot change to free tier via this endpoint" },
        { status: 400 }
      );
    }

    // Update subscription
    await updateSubscription(subscription.id, tierConfig.priceId);

    return NextResponse.json({
      success: true,
      message: `Plan changed to ${tierConfig.name}`,
    });
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
