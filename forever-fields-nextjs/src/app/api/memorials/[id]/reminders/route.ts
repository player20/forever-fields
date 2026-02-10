// Anniversary Reminders API for memorials
// CRUD operations for reminder subscriptions

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo reminders store
const demoReminders: Map<
  string,
  Array<{
    id: string;
    userId: string;
    memorialId: string;
    type: "birth" | "death" | "custom";
    customDate: string | null;
    customLabel: string | null;
    reminderDaysBefore: number;
    isEnabled: boolean;
    lastSentAt: string | null;
    nextSendAt: string | null;
    createdAt: string;
  }>
> = new Map();

// Calculate next send date for a reminder
function calculateNextSendAt(
  type: "birth" | "death" | "custom",
  memorial: { birthDate?: string; deathDate?: string },
  customDate?: string | null,
  reminderDaysBefore = 1
): Date | null {
  let targetDate: Date | null = null;

  if (type === "birth" && memorial.birthDate) {
    targetDate = new Date(memorial.birthDate);
  } else if (type === "death" && memorial.deathDate) {
    targetDate = new Date(memorial.deathDate);
  } else if (type === "custom" && customDate) {
    targetDate = new Date(customDate);
  }

  if (!targetDate) return null;

  const now = new Date();
  const thisYear = now.getFullYear();

  // Set to this year
  targetDate.setFullYear(thisYear);

  // Subtract reminder days
  targetDate.setDate(targetDate.getDate() - reminderDaysBefore);

  // If it's already passed this year, move to next year
  if (targetDate < now) {
    targetDate.setFullYear(thisYear + 1);
  }

  return targetDate;
}

// GET /api/memorials/[id]/reminders - List reminders for this memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const reminders = (demoReminders.get(memorialId) || []).filter(
      (r) => r.userId === user.id
    );
    return NextResponse.json({ reminders });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: reminders, error } = await supabase
      .from("anniversary_reminders")
      .select("*")
      .eq("memorial_id", memorialId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reminders:", error);
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    return NextResponse.json({ reminders: reminders || [] });
  } catch (error) {
    console.error("Reminders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/reminders - Create a reminder
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
    const body = await request.json();
    const { type, customDate, customLabel, reminderDaysBefore = 1 } = body as {
      type: "birth" | "death" | "custom";
      customDate?: string;
      customLabel?: string;
      reminderDaysBefore?: number;
    };

    if (!type || !["birth", "death", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reminder type. Must be 'birth', 'death', or 'custom'" },
        { status: 400 }
      );
    }

    if (type === "custom" && !customDate) {
      return NextResponse.json(
        { error: "Custom date is required for custom reminders" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      // Get memorial info for date calculation
      const memorial = {
        birthDate: "1940-01-15",
        deathDate: "2020-06-20",
      };

      const nextSendAt = calculateNextSendAt(
        type,
        memorial,
        customDate,
        reminderDaysBefore
      );

      const reminder = {
        id: `reminder-${Date.now()}`,
        userId: user.id,
        memorialId,
        type,
        customDate: customDate || null,
        customLabel: customLabel || null,
        reminderDaysBefore,
        isEnabled: true,
        lastSentAt: null,
        nextSendAt: nextSendAt?.toISOString() || null,
        createdAt: now,
      };

      const existing = demoReminders.get(memorialId) || [];

      // Check for duplicate
      if (existing.some((r) => r.userId === user.id && r.type === type)) {
        return NextResponse.json(
          { error: "You already have a reminder of this type for this memorial" },
          { status: 409 }
        );
      }

      demoReminders.set(memorialId, [...existing, reminder]);

      return NextResponse.json({ reminder }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Get memorial dates
    const { data: memorial } = await supabase
      .from("memorials")
      .select("birth_date, death_date")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    const nextSendAt = calculateNextSendAt(
      type,
      { birthDate: memorial.birth_date, deathDate: memorial.death_date },
      customDate,
      reminderDaysBefore
    );

    const { data: reminder, error } = await supabase
      .from("anniversary_reminders")
      .insert({
        user_id: user.id,
        memorial_id: memorialId,
        type,
        custom_date: customDate || null,
        custom_label: customLabel || null,
        reminder_days_before: reminderDaysBefore,
        is_enabled: true,
        next_send_at: nextSendAt?.toISOString() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "You already have a reminder of this type for this memorial" },
          { status: 409 }
        );
      }
      console.error("Error creating reminder:", error);
      return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
    }

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error("Reminder create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
