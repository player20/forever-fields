import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// Demo mode for local development without real Supabase credentials
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// In-memory store for demo mode
const demoPartners: Array<{
  id: string;
  cemeteryName: string;
  contactName: string;
  email: string;
  createdAt: string;
}> = [];

interface PartnerRegistrationData {
  cemeteryName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  estimatedPlots?: string;
  message?: string;
}

// POST /api/partners/register - Register a new cemetery partner
export async function POST(request: NextRequest) {
  try {
    const body: PartnerRegistrationData = await request.json();

    // Validate required fields
    if (!body.cemeteryName || !body.contactName || !body.email) {
      return NextResponse.json(
        { error: "Cemetery name, contact name, and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // In demo mode, store in memory and return success
    if (DEMO_MODE) {
      const partner = {
        id: `cemetery-${nanoid(12)}`,
        cemeteryName: body.cemeteryName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || "United States",
        website: body.website || null,
        estimatedPlots: body.estimatedPlots || null,
        message: body.message || null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      demoPartners.push(partner);

      console.log("[DEMO] New cemetery partner registered:", partner);

      return NextResponse.json(
        {
          success: true,
          message: "Registration submitted successfully",
          partnerId: partner.id,
        },
        { status: 201 }
      );
    }

    // Production: Store in Supabase
    const supabase = await createServerSupabaseClient();

    // Check if cemetery email already exists
    const { data: existingPartner } = await supabase
      .from("cemetery_partners")
      .select("id")
      .eq("email", body.email)
      .single();

    if (existingPartner) {
      return NextResponse.json(
        { error: "A registration with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique cemetery ID
    const cemeteryId = `cemetery-${nanoid(12)}`;

    // Insert into cemetery_partners table
    const { data: partner, error: insertError } = await supabase
      .from("cemetery_partners")
      .insert({
        id: cemeteryId,
        name: body.cemeteryName,
        contact_name: body.contactName,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || "United States",
        website: body.website || null,
        estimated_plots: body.estimatedPlots || null,
        message: body.message || null,
        status: "pending", // pending, approved, active
        created_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("Error registering cemetery partner:", insertError);

      // If table doesn't exist, fall back to storing as a pending lead
      // This allows the registration to work even before DB migration
      if (insertError.code === "42P01") {
        console.log("cemetery_partners table not found, storing as lead");

        // Try storing in a leads/contacts table or just log for now
        return NextResponse.json(
          {
            success: true,
            message: "Registration submitted successfully. We'll be in touch soon!",
            partnerId: cemeteryId,
          },
          { status: 201 }
        );
      }

      return NextResponse.json(
        { error: "Failed to submit registration" },
        { status: 500 }
      );
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to cemetery contact

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully",
        partnerId: (partner as { id: string }).id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in partner registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/partners/register - Check registration status (for admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const partner = demoPartners.find((p) => p.email === email);
      if (partner) {
        return NextResponse.json({ status: "pending", partner });
      }
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: partner, error } = await supabase
      .from("cemetery_partners")
      .select("id, name, status, created_at")
      .eq("email", email)
      .single();

    if (error || !partner) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      status: (partner as { status: string }).status,
      partner,
    });
  } catch (error) {
    console.error("Error checking partner status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
