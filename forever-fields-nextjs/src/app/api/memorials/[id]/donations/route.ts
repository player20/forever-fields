// Donations API for memorials
// Accept donations in memory of the deceased

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo donations store
const demoDonations: Map<string, Array<{
  id: string;
  memorialId: string;
  causeId: string | null;
  donorUserId: string | null;
  donorName: string;
  donorEmail: string | null;
  amount: number;
  currency: string;
  message: string | null;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
}>> = new Map();

// GET /api/memorials/[id]/donations - List donations for a memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (DEMO_MODE) {
    let donations = demoDonations.get(memorialId) || [];

    // Seed demo data if empty
    if (donations.length === 0) {
      donations = [
        {
          id: "donation-1",
          memorialId,
          causeId: null,
          donorUserId: null,
          donorName: "Sarah Johnson",
          donorEmail: "sarah@example.com",
          amount: 50,
          currency: "USD",
          message: "In loving memory. You will be deeply missed.",
          isAnonymous: false,
          status: "completed",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: "donation-2",
          memorialId,
          causeId: null,
          donorUserId: null,
          donorName: "Anonymous",
          donorEmail: null,
          amount: 100,
          currency: "USD",
          message: null,
          isAnonymous: true,
          status: "completed",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: "donation-3",
          memorialId,
          causeId: null,
          donorUserId: null,
          donorName: "Michael Thompson",
          donorEmail: "michael@example.com",
          amount: 25,
          currency: "USD",
          message: "Forever in our hearts",
          isAnonymous: false,
          status: "completed",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        },
      ];
      demoDonations.set(memorialId, donations);
    }

    const completedDonations = donations.filter((d) => d.status === "completed");
    const totalAmount = completedDonations.reduce((sum, d) => sum + d.amount, 0);

    // Hide email for non-owners
    const publicDonations = completedDonations.map((d) => ({
      ...d,
      donorEmail: undefined,
      donorName: d.isAnonymous ? "Anonymous" : d.donorName,
    }));

    return NextResponse.json({
      donations: publicDonations.slice(0, limit),
      total: completedDonations.length,
      totalAmount,
      currency: "USD",
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await optionalAuth();

    // Check memorial ownership for full data access
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id, donation_goal")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    const isOwner = user?.id === memorial.user_id;

    // Get donations
    const { data: donations, error } = await supabase
      .from("donations")
      .select("*")
      .eq("memorial_id", memorialId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching donations:", error);
      return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
    }

    // Calculate total
    const { data: totals } = await supabase
      .from("donations")
      .select("amount.sum()")
      .eq("memorial_id", memorialId)
      .eq("status", "completed")
      .single();

    const totalAmount = totals?.sum || 0;

    // Hide sensitive data for non-owners
    const publicDonations = (donations || []).map((d) => ({
      id: d.id,
      donorName: d.is_anonymous ? "Anonymous" : d.donor_name,
      amount: d.amount,
      currency: d.currency,
      message: d.message,
      isAnonymous: d.is_anonymous,
      createdAt: d.created_at,
      ...(isOwner && { donorEmail: d.donor_email }),
    }));

    return NextResponse.json({
      donations: publicDonations,
      total: donations?.length || 0,
      totalAmount,
      goalAmount: memorial.donation_goal,
      currency: "USD",
    });
  } catch (error) {
    console.error("Donations fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/donations - Create a donation (initiate payment)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  try {
    const body = await request.json();
    const { amount, donorName, donorEmail, message, isAnonymous, causeId } = body as {
      amount: number;
      donorName: string;
      donorEmail?: string;
      message?: string;
      isAnonymous?: boolean;
      causeId?: string;
    };

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Amount must be at least $1" },
        { status: 400 }
      );
    }

    if (!donorName && !isAnonymous) {
      return NextResponse.json(
        { error: "Donor name is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE || !process.env.STRIPE_SECRET_KEY) {
      const donation = {
        id: `donation-${Date.now()}`,
        memorialId,
        causeId: causeId || null,
        donorUserId: user?.id || null,
        donorName: isAnonymous ? "Anonymous" : donorName,
        donorEmail: donorEmail || null,
        amount,
        currency: "USD",
        message: message || null,
        isAnonymous: isAnonymous || false,
        status: "completed", // Auto-complete for demo
        createdAt: now,
      };

      const existing = demoDonations.get(memorialId) || [];
      demoDonations.set(memorialId, [donation, ...existing]);

      return NextResponse.json({
        donation,
        demo: true,
        message: "Demo mode: Donation recorded without payment",
      }, { status: 201 });
    }

    // Real Stripe integration would go here
    const supabase = await createServerSupabaseClient();

    // Verify memorial exists and allows donations
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, allow_donations")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    if (!memorial.allow_donations) {
      return NextResponse.json(
        { error: "Donations are not enabled for this memorial" },
        { status: 403 }
      );
    }

    // Create pending donation record
    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        memorial_id: memorialId,
        cause_id: causeId || null,
        donor_user_id: user?.id || null,
        donor_name: isAnonymous ? "Anonymous" : donorName,
        donor_email: donorEmail || null,
        amount,
        currency: "USD",
        message: message || null,
        is_anonymous: isAnonymous || false,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating donation:", error);
      return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
    }

    // Create Stripe checkout session
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation in memory of ${memorialId}`,
              description: message || "Thank you for your generosity",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/memorial/${memorialId}?donation=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/memorial/${memorialId}?donation=cancelled`,
      metadata: {
        donationId: donation.id,
        memorialId,
        type: "memorial_donation",
      },
    });

    return NextResponse.json({
      donationId: donation.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Donation create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
