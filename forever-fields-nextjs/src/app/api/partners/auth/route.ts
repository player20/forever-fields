// Partner Authentication API
// Authenticate partners via email/password or API key

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import crypto from "crypto";

// Demo partners store
const demoPartners: Map<string, {
  id: string;
  name: string;
  slug: string;
  email: string;
  apiKey: string;
  apiKeyHash: string;
  isActive: boolean;
}> = new Map();

// Initialize demo partners
if (demoPartners.size === 0) {
  const partners = [
    {
      id: "partner-1",
      name: "FlowerCo",
      slug: "flowerco",
      email: "orders@flowerco.com",
      apiKey: "ff_partner_test_flowerco_123456",
      isActive: true,
    },
    {
      id: "partner-2",
      name: "StoneCraft Memorial",
      slug: "stonecraft",
      email: "partners@stonecraft.com",
      apiKey: "ff_partner_test_stonecraft_789012",
      isActive: true,
    },
  ];

  partners.forEach((p) => {
    demoPartners.set(p.id, {
      ...p,
      apiKeyHash: crypto.createHash("sha256").update(p.apiKey).digest("hex"),
    });
  });
}

// Helper to verify API key
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// POST /api/partners/auth - Authenticate partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, apiKey } = body;

    // API Key authentication
    if (apiKey) {
      if (DEMO_MODE) {
        const keyHash = hashApiKey(apiKey);
        const partner = Array.from(demoPartners.values()).find(
          (p) => p.apiKeyHash === keyHash
        );

        if (!partner) {
          return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        if (!partner.isActive) {
          return NextResponse.json({ error: "Partner account is inactive" }, { status: 403 });
        }

        // Generate session token
        const sessionToken = `ff_session_${crypto.randomBytes(32).toString("hex")}`;

        return NextResponse.json({
          success: true,
          partner: {
            id: partner.id,
            name: partner.name,
            slug: partner.slug,
            email: partner.email,
          },
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const supabase = await createServerSupabaseClient();
      const keyHash = hashApiKey(apiKey);

      const { data: partner, error } = await supabase
        .from("shop_partners")
        .select("id, name, slug, contact_email, is_active")
        .eq("api_key_hash", keyHash)
        .single();

      if (error || !partner) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      if (!partner.is_active) {
        return NextResponse.json({ error: "Partner account is inactive" }, { status: 403 });
      }

      const sessionToken = `ff_session_${crypto.randomBytes(32).toString("hex")}`;

      return NextResponse.json({
        success: true,
        partner: {
          id: partner.id,
          name: partner.name,
          slug: partner.slug,
          email: partner.contact_email,
        },
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Email/password authentication
    if (email && password) {
      if (DEMO_MODE) {
        // For demo, accept any partner email with password "demo123"
        const partner = Array.from(demoPartners.values()).find(
          (p) => p.email.toLowerCase() === email.toLowerCase()
        );

        if (!partner || password !== "demo123") {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const sessionToken = `ff_session_${crypto.randomBytes(32).toString("hex")}`;

        return NextResponse.json({
          success: true,
          partner: {
            id: partner.id,
            name: partner.name,
            slug: partner.slug,
            email: partner.email,
          },
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Production: Use Supabase auth or custom partner auth
      return NextResponse.json(
        { error: "Email authentication not configured" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: "API key or email/password required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Partner auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// GET /api/partners/auth - Verify session token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  // For demo, we just verify token format
  if (DEMO_MODE) {
    if (!token.startsWith("ff_session_")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Return first demo partner for simplicity
    const partner = Array.from(demoPartners.values())[0];
    return NextResponse.json({
      valid: true,
      partner: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        email: partner.email,
      },
    });
  }

  // Production: Verify token in database
  return NextResponse.json({ error: "Token verification not configured" }, { status: 501 });
}
