// Analytics Event Tracking API
// Record views, interactions, and engagement

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { detectDeviceType } from "@/lib/analytics";

// POST /api/analytics/track - Track an analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memorialId, eventType, visitorId, metadata } = body as {
      memorialId: string;
      eventType: string;
      visitorId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!memorialId || !eventType) {
      return NextResponse.json(
        { error: "memorialId and eventType are required" },
        { status: 400 }
      );
    }

    const { user } = await optionalAuth();
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;

    // Extract geolocation from headers (if behind a CDN like Vercel/Cloudflare)
    const country = request.headers.get("x-vercel-ip-country") ||
                   request.headers.get("cf-ipcountry") || undefined;
    const city = request.headers.get("x-vercel-ip-city") ||
                request.headers.get("cf-ipcity") || undefined;

    if (DEMO_MODE) {
      console.log("[Analytics] Demo track:", {
        memorialId,
        eventType,
        visitorId,
        userId: user?.id,
      });
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();

    // Type assertion needed as analytics_events may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("analytics_events").insert({
      memorial_id: memorialId,
      event_type: eventType,
      visitor_id: visitorId || null,
      user_id: user?.id || null,
      referrer: referrer || null,
      user_agent: userAgent || null,
      country: country || null,
      city: city || null,
      device_type: userAgent ? detectDeviceType(userAgent) : null,
      metadata: metadata || null,
    });

    if (error) {
      console.error("Error tracking event:", error);
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
