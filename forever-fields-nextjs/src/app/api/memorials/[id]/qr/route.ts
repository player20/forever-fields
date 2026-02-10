/**
 * QR Code Management API for Memorials
 *
 * Generates and manages short QR code tokens that redirect to memorial pages.
 * QR codes can be printed on headstones, memorial cards, or funeral programs.
 *
 * Endpoints:
 * - GET    /api/memorials/[id]/qr - Get QR code info and scan statistics
 * - POST   /api/memorials/[id]/qr - Generate a new QR token (or regenerate existing)
 * - DELETE /api/memorials/[id]/qr - Remove the QR token
 *
 * The short URL format is: {base_url}/qr/{token}
 * Tokens are 8 characters, URL-safe, and unique across all memorials.
 *
 * @module api/memorials/[id]/qr
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { nanoid } from "nanoid";

// Demo QR tokens store
const demoQRTokens: Map<string, {
  memorialId: string;
  token: string;
  createdAt: string;
  scanCount: number;
}> = new Map();

// Generate a short, readable token
function generateQRToken(): string {
  // 8 characters, URL-safe
  return nanoid(8);
}

// GET /api/memorials/[id]/qr - Get QR code info for a memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;

  if (DEMO_MODE) {
    const existing = demoQRTokens.get(memorialId);

    if (existing) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";
      return NextResponse.json({
        token: existing.token,
        shortUrl: `${baseUrl}/qr/${existing.token}`,
        fullUrl: `${baseUrl}/memorial/${memorialId}`,
        scanCount: existing.scanCount,
        createdAt: existing.createdAt,
      });
    }

    return NextResponse.json({ token: null });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: memorial, error } = await supabase
      .from("memorials")
      .select("id, qr_code_token, qr_code_url")
      .eq("id", memorialId)
      .single();

    if (error || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Get scan count from analytics
    const { count: scanCount } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("memorial_id", memorialId)
      .eq("event_type", "qr_scanned");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";

    return NextResponse.json({
      token: memorial.qr_code_token,
      shortUrl: memorial.qr_code_token ? `${baseUrl}/qr/${memorial.qr_code_token}` : null,
      fullUrl: `${baseUrl}/memorial/${memorialId}`,
      customUrl: memorial.qr_code_url,
      scanCount: scanCount || 0,
    });
  } catch (error) {
    console.error("QR fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/qr - Generate a new QR token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { regenerate } = body as { regenerate?: boolean };

    if (DEMO_MODE) {
      const existing = demoQRTokens.get(memorialId);

      if (existing && !regenerate) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";
        return NextResponse.json({
          token: existing.token,
          shortUrl: `${baseUrl}/qr/${existing.token}`,
          isNew: false,
        });
      }

      const token = generateQRToken();
      const now = new Date().toISOString();

      demoQRTokens.set(memorialId, {
        memorialId,
        token,
        createdAt: now,
        scanCount: 0,
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";

      return NextResponse.json({
        token,
        shortUrl: `${baseUrl}/qr/${token}`,
        isNew: true,
      }, { status: regenerate ? 200 : 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id, qr_code_token")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Return existing token if not regenerating
    if (memorial.qr_code_token && !regenerate) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";
      return NextResponse.json({
        token: memorial.qr_code_token,
        shortUrl: `${baseUrl}/qr/${memorial.qr_code_token}`,
        isNew: false,
      });
    }

    // Generate new token
    let token = generateQRToken();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from("memorials")
        .select("id")
        .eq("qr_code_token", token)
        .single();

      if (!existing) break;
      token = generateQRToken();
      attempts++;
    }

    // Update memorial with new token
    const { error } = await supabase
      .from("memorials")
      .update({ qr_code_token: token })
      .eq("id", memorialId);

    if (error) {
      console.error("Error generating QR token:", error);
      return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverfields.com";

    return NextResponse.json({
      token,
      shortUrl: `${baseUrl}/qr/${token}`,
      isNew: true,
    }, { status: regenerate ? 200 : 201 });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/qr - Remove QR token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    demoQRTokens.delete(memorialId);
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("memorials")
      .update({ qr_code_token: null })
      .eq("id", memorialId);

    if (error) {
      console.error("Error removing QR token:", error);
      return NextResponse.json({ error: "Failed to remove QR code" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QR delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
