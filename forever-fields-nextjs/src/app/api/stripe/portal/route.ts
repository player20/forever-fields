// Stripe customer portal API endpoint

import { NextRequest, NextResponse } from "next/server";
import { createPortalSession, getOrCreateCustomer } from "@/lib/stripe";
import { requireAuth } from "@/lib/supabase/server";

// POST /api/stripe/portal - Create customer portal session
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create Stripe customer using authenticated user
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name || user.user_metadata?.first_name
    );

    // Build return URL
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${origin}/settings`;

    // Create portal session
    const { url } = await createPortalSession(customerId, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create portal session",
      },
      { status: 500 }
    );
  }
}
