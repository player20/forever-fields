// Mark Notifications as Read API

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo notifications store - shared with parent route
// In production, this would be the database
const demoNotifications: Map<string, Array<{
  id: string;
  userId: string;
  isRead: boolean;
  readAt: string | null;
  [key: string]: unknown;
}>> = new Map();

// POST /api/notifications/read - Mark notifications as read
export async function POST(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationIds, markAll } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    if (!notificationIds?.length && !markAll) {
      return NextResponse.json(
        { error: "Either notificationIds or markAll is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const notifications = demoNotifications.get(user.id) || [];

      for (const notif of notifications) {
        if (markAll || notificationIds?.includes(notif.id)) {
          notif.isRead = true;
          notif.readAt = now;
        }
      }

      demoNotifications.set(user.id, notifications);

      return NextResponse.json({
        success: true,
        updatedCount: markAll
          ? notifications.filter((n) => n.isRead).length
          : notificationIds?.length || 0,
      });
    }

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("user_id", user.id);

    if (!markAll && notificationIds) {
      query = query.in("id", notificationIds);
    }

    const { error, count } = await query;

    if (error) {
      console.error("Error marking notifications as read:", error);
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updatedCount: count || 0,
    });
  } catch (error) {
    console.error("Notification read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
