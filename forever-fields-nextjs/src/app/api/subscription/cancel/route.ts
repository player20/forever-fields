/**
 * Subscription Cancel API
 *
 * Cancel or reactivate a subscription.
 *
 * Endpoints:
 * - POST /api/subscription/cancel - Cancel subscription at period end
 * - DELETE /api/subscription/cancel - Reactivate a canceled subscription
 *
 * @module api/subscription/cancel
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import {
  getOrCreateCustomer,
  getActiveSubscription,
  cancelSubscription,
  reactivateSubscription,
} from "@/lib/stripe/subscriptions";

// POST /api/subscription/cancel - Cancel subscription
export async function POST() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancelAtPeriodEnd: true,
    });
  }

  try {
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

    // Cancel at period end (not immediately)
    await cancelSubscription(subscription.id, false);

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancelAtPeriodEnd: true,
    });
  } catch (error) {
    console.error("Subscription cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}

// DELETE /api/subscription/cancel - Reactivate subscription
export async function DELETE() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      success: true,
      message: "Subscription reactivated",
      cancelAtPeriodEnd: false,
    });
  }

  try {
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email || "",
      user.user_metadata?.full_name
    );

    const subscription = await getActiveSubscription(customerId);

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Reactivate
    await reactivateSubscription(subscription.id);

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated",
      cancelAtPeriodEnd: false,
    });
  } catch (error) {
    console.error("Subscription reactivate error:", error);
    return NextResponse.json({ error: "Failed to reactivate subscription" }, { status: 500 });
  }
}
