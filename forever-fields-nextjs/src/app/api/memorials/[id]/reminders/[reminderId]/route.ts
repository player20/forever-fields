// Individual Anniversary Reminder API
// Update and delete reminder subscriptions

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo reminders store (shared with parent route - in production use DB)
const demoReminders: Map<string, Array<{
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
}>> = new Map();

// PATCH /api/memorials/[id]/reminders/[reminderId] - Update a reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  const { id: memorialId, reminderId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reminderDaysBefore, isEnabled, customLabel } = body as {
      reminderDaysBefore?: number;
      isEnabled?: boolean;
      customLabel?: string;
    };

    if (DEMO_MODE) {
      const reminders = demoReminders.get(memorialId) || [];
      const index = reminders.findIndex((r) => r.id === reminderId && r.userId === user.id);

      if (index === -1) {
        return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
      }

      const updated = {
        ...reminders[index],
        ...(reminderDaysBefore !== undefined && { reminderDaysBefore }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(customLabel !== undefined && { customLabel }),
      };

      reminders[index] = updated;
      demoReminders.set(memorialId, reminders);

      return NextResponse.json({ reminder: updated });
    }

    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("anniversary_reminders")
      .select("*")
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (reminderDaysBefore !== undefined) updates.reminder_days_before = reminderDaysBefore;
    if (isEnabled !== undefined) updates.is_enabled = isEnabled;
    if (customLabel !== undefined) updates.custom_label = customLabel;

    const { data: reminder, error } = await supabase
      .from("anniversary_reminders")
      .update(updates)
      .eq("id", reminderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating reminder:", error);
      return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
    }

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error("Reminder update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/reminders/[reminderId] - Delete a reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  const { id: memorialId, reminderId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const reminders = demoReminders.get(memorialId) || [];
    const index = reminders.findIndex((r) => r.id === reminderId && r.userId === user.id);

    if (index === -1) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    reminders.splice(index, 1);
    demoReminders.set(memorialId, reminders);

    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("anniversary_reminders")
      .delete()
      .eq("id", reminderId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting reminder:", error);
      return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reminder delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
