// User's Anniversary Reminders API
// List all reminders across all memorials for the current user

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo data for user reminders
const demoUserReminders = [
  {
    id: "reminder-demo-1",
    userId: "demo-user",
    memorialId: "memorial-1",
    type: "death",
    customDate: null,
    customLabel: null,
    reminderDaysBefore: 7,
    isEnabled: true,
    lastSentAt: null,
    nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    memorial: {
      id: "memorial-1",
      firstName: "Eleanor",
      lastName: "Thompson",
      birthDate: "1940-03-15",
      deathDate: "2020-11-20",
      profilePhotoUrl: null,
      slug: "eleanor-thompson",
    },
  },
  {
    id: "reminder-demo-2",
    userId: "demo-user",
    memorialId: "memorial-1",
    type: "birth",
    customDate: null,
    customLabel: null,
    reminderDaysBefore: 1,
    isEnabled: true,
    lastSentAt: null,
    nextSendAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    memorial: {
      id: "memorial-1",
      firstName: "Eleanor",
      lastName: "Thompson",
      birthDate: "1940-03-15",
      deathDate: "2020-11-20",
      profilePhotoUrl: null,
      slug: "eleanor-thompson",
    },
  },
];

// GET /api/users/me/reminders - List all user's reminders
export async function GET(request: NextRequest) {
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  if (DEMO_MODE) {
    let reminders = [...demoUserReminders];

    if (upcoming) {
      const now = new Date();
      reminders = reminders
        .filter((r) => r.isEnabled && r.nextSendAt && new Date(r.nextSendAt) > now)
        .sort((a, b) => new Date(a.nextSendAt!).getTime() - new Date(b.nextSendAt!).getTime());
    }

    return NextResponse.json({
      reminders: reminders.slice(0, limit),
      total: reminders.length,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("anniversary_reminders")
      .select(`
        *,
        memorial:memorials (
          id,
          first_name,
          last_name,
          birth_date,
          death_date,
          profile_photo_url,
          slug
        )
      `)
      .eq("user_id", user.id);

    if (upcoming) {
      query = query
        .eq("is_enabled", true)
        .not("next_send_at", "is", null)
        .gt("next_send_at", new Date().toISOString())
        .order("next_send_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.limit(limit);

    const { data: reminders, error, count } = await query;

    if (error) {
      console.error("Error fetching user reminders:", error);
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    return NextResponse.json({
      reminders: reminders || [],
      total: count || reminders?.length || 0,
    });
  } catch (error) {
    console.error("User reminders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
