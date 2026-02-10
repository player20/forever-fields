// Analytics Event Tracking
// Track memorial views, interactions, and engagement

import { DEMO_MODE } from "@/lib/constants";

// Event types for analytics
export type AnalyticsEventType =
  | "view"
  | "share"
  | "download"
  | "candle_lit"
  | "guestbook_signed"
  | "story_shared"
  | "photo_viewed"
  | "photo_uploaded"
  | "time_capsule_opened"
  | "qr_scanned"
  | "donation_started"
  | "donation_completed";

export interface TrackEventParams {
  memorialId: string;
  eventType: AnalyticsEventType;
  visitorId?: string;
  userId?: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// In-memory demo store for analytics
const demoEvents: Map<string, Array<{
  id: string;
  memorialId: string;
  eventType: string;
  visitorId: string | null;
  userId: string | null;
  referrer: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}>> = new Map();

/**
 * Generate a unique visitor ID for anonymous tracking
 */
export function generateVisitorId(): string {
  if (typeof window === "undefined") {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Check for existing visitor ID
  let visitorId = localStorage.getItem("ff_visitor_id");
  if (!visitorId) {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ff_visitor_id", visitorId);
  }
  return visitorId;
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent?: string): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * Track an analytics event
 * Can be called from client or server side
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  if (DEMO_MODE) {
    const event = {
      id: `event-${Date.now()}`,
      ...params,
      visitorId: params.visitorId || null,
      userId: params.userId || null,
      referrer: params.referrer || null,
      userAgent: params.userAgent || null,
      country: null,
      city: null,
      deviceType: params.userAgent ? detectDeviceType(params.userAgent) : null,
      metadata: params.metadata || null,
      createdAt: new Date().toISOString(),
    };

    const existing = demoEvents.get(params.memorialId) || [];
    demoEvents.set(params.memorialId, [...existing, event]);
    console.log("[Analytics] Demo event tracked:", params.eventType);
    return;
  }

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Client-side hook for tracking page views
 */
export function useTrackPageView(memorialId: string) {
  if (typeof window === "undefined") return;

  // Track on mount (client-side only)
  const visitorId = generateVisitorId();

  trackEvent({
    memorialId,
    eventType: "view",
    visitorId,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
  });
}

/**
 * Get demo analytics data for a memorial
 */
export function getDemoAnalytics(memorialId: string) {
  const events = demoEvents.get(memorialId) || [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Generate some demo data if empty
  if (events.length === 0) {
    const demoData = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const eventTypes: AnalyticsEventType[] = [
        "view", "view", "view", "view", // More views
        "share",
        "candle_lit",
        "guestbook_signed",
        "story_shared",
      ];

      demoData.push({
        id: `event-demo-${i}`,
        memorialId,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        visitorId: `visitor-${Math.floor(Math.random() * 20)}`,
        userId: null,
        referrer: Math.random() > 0.5 ? "facebook.com" : Math.random() > 0.5 ? "google.com" : null,
        userAgent: "Demo User Agent",
        country: ["United States", "Canada", "United Kingdom", "Australia"][Math.floor(Math.random() * 4)],
        city: ["New York", "Los Angeles", "London", "Toronto"][Math.floor(Math.random() * 4)],
        deviceType: ["mobile", "desktop", "tablet"][Math.floor(Math.random() * 3)],
        metadata: null,
        createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    demoEvents.set(memorialId, demoData);
    return getDemoAnalytics(memorialId);
  }

  // Calculate stats
  const last30Days = events.filter((e) => new Date(e.createdAt) >= thirtyDaysAgo);
  const last7Days = events.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);

  const views30d = last30Days.filter((e) => e.eventType === "view").length;
  const views7d = last7Days.filter((e) => e.eventType === "view").length;

  const uniqueVisitors30d = new Set(last30Days.map((e) => e.visitorId)).size;
  const uniqueVisitors7d = new Set(last7Days.map((e) => e.visitorId)).size;

  // Group by event type
  const eventCounts: Record<string, number> = {};
  for (const event of last30Days) {
    eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
  }

  // Group by day for chart
  const dailyViews: Array<{ date: string; views: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const dayViews = last30Days.filter(
      (e) =>
        e.eventType === "view" &&
        e.createdAt.startsWith(dateStr)
    ).length;
    dailyViews.push({ date: dateStr, views: dayViews });
  }

  // Top referrers
  const referrerCounts: Record<string, number> = {};
  for (const event of last30Days) {
    if (event.referrer) {
      referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
    }
  }
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  for (const event of last30Days) {
    if (event.deviceType) {
      deviceCounts[event.deviceType] = (deviceCounts[event.deviceType] || 0) + 1;
    }
  }

  return {
    summary: {
      totalViews: events.filter((e) => e.eventType === "view").length,
      views30d,
      views7d,
      uniqueVisitors30d,
      uniqueVisitors7d,
      candlesLit: eventCounts["candle_lit"] || 0,
      storiesShared: eventCounts["story_shared"] || 0,
      guestbookSigned: eventCounts["guestbook_signed"] || 0,
      shares: eventCounts["share"] || 0,
    },
    dailyViews,
    topReferrers,
    deviceBreakdown: deviceCounts,
    recentEvents: last7Days.slice(0, 20),
  };
}
