// In-App Notifications API
// List and manage user notifications

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Notification type for type safety
type NotificationType =
  | "ANNIVERSARY_BIRTH"
  | "ANNIVERSARY_DEATH"
  | "NEW_GUESTBOOK_ENTRY"
  | "NEW_STORY"
  | "NEW_PHOTO"
  | "NEW_VIDEO"
  | "CANDLE_LIT"
  | "TIME_CAPSULE_OPENED"
  | "MEMORIAL_VIEW_MILESTONE"
  | "DONATION_RECEIVED"
  | "COLLABORATOR_INVITE"
  | "CLAIM_REQUEST"
  | "SYSTEM_ANNOUNCEMENT";

interface DemoNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  linkText: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// Demo notifications store
const demoNotifications: Map<string, DemoNotification[]> = new Map();

// Seed demo notifications
function seedDemoNotifications(userId: string): DemoNotification[] {
  const now = new Date();
  return [
    {
      id: "notif-1",
      userId,
      type: "CANDLE_LIT",
      title: "Candle Lit",
      message: "Sarah lit a candle for Eleanor Thompson",
      linkUrl: "/memorial/eleanor-thompson",
      linkText: "View Memorial",
      imageUrl: null,
      metadata: { memorialId: "memorial-1", lighterName: "Sarah" },
      isRead: false,
      readAt: null,
      createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
      id: "notif-2",
      userId,
      type: "NEW_STORY",
      title: "New Memory Shared",
      message: "Michael shared a memory about Eleanor Thompson",
      linkUrl: "/memorial/eleanor-thompson?tab=memories",
      linkText: "Read Memory",
      imageUrl: null,
      metadata: { memorialId: "memorial-1", authorName: "Michael" },
      isRead: false,
      readAt: null,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "notif-3",
      userId,
      type: "ANNIVERSARY_DEATH",
      title: "Anniversary Reminder",
      message: "Tomorrow marks the 4th anniversary of Eleanor Thompson's passing",
      linkUrl: "/memorial/eleanor-thompson",
      linkText: "Visit Memorial",
      imageUrl: null,
      metadata: { memorialId: "memorial-1" },
      isRead: true,
      readAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: "notif-4",
      userId,
      type: "COLLABORATOR_INVITE",
      title: "Collaboration Invite",
      message: "John invited you to contribute to Robert Thompson's memorial",
      linkUrl: "/invites/abc123",
      linkText: "View Invite",
      imageUrl: null,
      metadata: { memorialId: "memorial-2", inviterName: "John" },
      isRead: true,
      readAt: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    },
  ];
}

// GET /api/notifications - List notifications
export async function GET(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (DEMO_MODE) {
    // Initialize demo notifications if needed
    if (!demoNotifications.has(user.id)) {
      demoNotifications.set(user.id, seedDemoNotifications(user.id));
    }

    let notifications = demoNotifications.get(user.id) || [];

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    const total = notifications.length;
    notifications = notifications.slice(offset, offset + limit);

    const unreadCount = (demoNotifications.get(user.id) || []).filter(
      (n) => !n.isRead
    ).length;

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  // This endpoint is for internal use only
  // Verify internal secret
  const authHeader = request.headers.get("x-internal-secret");
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret || authHeader !== internalSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, type, title, message, linkUrl, linkText, imageUrl, metadata } = body as {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      linkUrl?: string;
      linkText?: string;
      imageUrl?: string;
      metadata?: Record<string, unknown>;
    };

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title, and message are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const notification: DemoNotification = {
        id: `notif-${Date.now()}`,
        userId,
        type,
        title,
        message,
        linkUrl: linkUrl || null,
        linkText: linkText || null,
        imageUrl: imageUrl || null,
        metadata: metadata || null,
        isRead: false,
        readAt: null,
        createdAt: now,
      };

      const existing = demoNotifications.get(userId) || [];
      demoNotifications.set(userId, [notification, ...existing]);

      return NextResponse.json({ notification }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link_url: linkUrl || null,
        link_text: linkText || null,
        image_url: imageUrl || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Notification create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
