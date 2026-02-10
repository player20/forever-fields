// Memorial Analytics API
// Get analytics data for a memorial

import { NextRequest, NextResponse } from "next/server";
import { createUntypedSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { getDemoAnalytics } from "@/lib/analytics";

// GET /api/memorials/[id]/analytics - Get analytics for a memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";

  if (DEMO_MODE) {
    const analytics = getDemoAnalytics(memorialId);
    return NextResponse.json(analytics);
  }

  try {
    const supabase = await createUntypedSupabaseClient();

    // Verify user owns the memorial
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get events in range
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("memorial_id", memorialId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }

    // Get total view count (all time)
    const { count: totalViews } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("memorial_id", memorialId)
      .eq("event_type", "view");

    // Calculate stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const views = events?.filter((e: any) => e.event_type === "view") || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueVisitors = new Set(views.map((e: any) => e.visitor_id)).size;

    // Group by event type
    const eventCounts: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of (events || []) as any[]) {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    }

    // Daily views for chart
    const dailyData: Record<string, { views: number; visitors: Set<string> }> = {};
    for (const event of views) {
      const dateStr = event.created_at.split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { views: 0, visitors: new Set() };
      }
      dailyData[dateStr].views++;
      if (event.visitor_id) {
        dailyData[dateStr].visitors.add(event.visitor_id);
      }
    }

    const dailyViews = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueVisitors: data.visitors.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top referrers
    const referrerCounts: Record<string, number> = {};
    for (const event of events || []) {
      if (event.referrer) {
        try {
          const url = new URL(event.referrer);
          const domain = url.hostname.replace("www.", "");
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
        }
      }
    }
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    for (const event of events || []) {
      if (event.device_type) {
        deviceCounts[event.device_type] = (deviceCounts[event.device_type] || 0) + 1;
      }
    }

    // Country breakdown
    const countryCounts: Record<string, number> = {};
    for (const event of events || []) {
      if (event.country) {
        countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
      }
    }
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    return NextResponse.json({
      summary: {
        totalViews: totalViews || 0,
        periodViews: views.length,
        uniqueVisitors,
        candlesLit: eventCounts["candle_lit"] || 0,
        storiesShared: eventCounts["story_shared"] || 0,
        guestbookSigned: eventCounts["guestbook_signed"] || 0,
        shares: eventCounts["share"] || 0,
        photosViewed: eventCounts["photo_viewed"] || 0,
      },
      dailyViews,
      topReferrers,
      deviceBreakdown: deviceCounts,
      topCountries,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
