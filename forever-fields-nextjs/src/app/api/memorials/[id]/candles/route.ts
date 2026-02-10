// Candle Lighting API for memorials
// Light virtual candles in memory

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { getMemorial, addCandleLighting } from "@/lib/demo-store";

// Candle duration in hours (default 24 hours)
const CANDLE_DURATION_HOURS = 24;

// GET /api/memorials/[id]/candles - List active candles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const now = new Date();

  if (DEMO_MODE) {
    const memorial = getMemorial(memorialId);
    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }
    // Return candles from persistent store (they don't expire in demo)
    const candles = memorial.candle_lightings.map((c) => ({
      id: c.id,
      memorialId,
      litByName: c.name,
      message: c.message,
      createdAt: c.lit_at,
      expiresAt: new Date(new Date(c.lit_at).getTime() + CANDLE_DURATION_HOURS * 60 * 60 * 1000).toISOString(),
    }));
    return NextResponse.json({
      candles,
      totalLit: candles.length,
      totalEverLit: candles.length,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: candles, error } = await supabase
      .from("candle_lightings")
      .select("*")
      .eq("memorial_id", memorialId)
      .gt("expires_at", now.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching candles:", error);
      return NextResponse.json({ error: "Failed to fetch candles" }, { status: 500 });
    }

    // Also get total count of all candles ever lit
    const { count: totalEverLit } = await supabase
      .from("candle_lightings")
      .select("*", { count: "exact", head: true })
      .eq("memorial_id", memorialId);

    return NextResponse.json({
      candles: candles || [],
      totalLit: candles?.length || 0,
      totalEverLit: totalEverLit || 0,
    });
  } catch (error) {
    console.error("Candles fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/candles - Light a candle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  try {
    const body = await request.json();
    const { litByName, message } = body;

    // Calculate expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CANDLE_DURATION_HOURS * 60 * 60 * 1000);

    if (DEMO_MODE) {
      const candleData = {
        id: `candle-${Date.now()}`,
        name: litByName || "Anonymous",
        message: message || null,
        lit_at: now.toISOString(),
      };

      const memorial = addCandleLighting(memorialId, candleData);
      if (!memorial) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
      }

      return NextResponse.json({
        candle: {
          id: candleData.id,
          memorialId,
          litByName: candleData.name,
          message: candleData.message,
          createdAt: candleData.lit_at,
          expiresAt: expiresAt.toISOString(),
        },
      }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if memorial exists and allows candle lighting
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, allow_candle_lighting")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    if (!memorial.allow_candle_lighting) {
      return NextResponse.json(
        { error: "Candle lighting is disabled for this memorial" },
        { status: 403 }
      );
    }

    const { data: candle, error } = await supabase
      .from("candle_lightings")
      .insert({
        memorial_id: memorialId,
        lit_by_name: litByName || "Anonymous",
        lit_by_user_id: user?.id || null,
        message: message || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error lighting candle:", error);
      return NextResponse.json({ error: "Failed to light candle" }, { status: 500 });
    }

    return NextResponse.json({ candle }, { status: 201 });
  } catch (error) {
    console.error("Candle light error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
