/**
 * Stripe Customer Portal API
 *
 * Creates a Stripe billing portal session for users to manage:
 * - Payment methods
 * - Billing information
 * - Invoice history
 *
 * @module api/subscription/portal
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { stripe } from "@/lib/stripe/config";
import { getOrCreateCustomer } from "@/lib/stripe/subscriptions";

// POST /api/subscription/portal - Create billing portal session
export async function POST() {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      url: "/settings?tab=billing&demo=portal",
      message: "Demo mode: Stripe portal not available",
    });
  }

  try {
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email || "",
      user.user_metadata?.full_name
    );

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?tab=billing`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
