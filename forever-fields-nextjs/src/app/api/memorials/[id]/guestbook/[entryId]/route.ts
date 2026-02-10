// Individual Guestbook Entry API
// Approve, update, delete entries

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// PATCH /api/memorials/[id]/guestbook/[entryId] - Update/approve entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, entryId } = await params;
  const body = await request.json();

  // Only allow updating approval status
  const { isApproved } = body;

  if (typeof isApproved !== "boolean") {
    return NextResponse.json({ error: "isApproved must be a boolean" }, { status: 400 });
  }

  if (DEMO_MODE) {
    return NextResponse.json({
      entry: { id: entryId, memorialId, isApproved, updatedAt: new Date().toISOString() },
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if user owns the memorial
    const { data: memorial } = await supabase
      .from("memorials")
      .select("user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: entry, error } = await supabase
      .from("guestbook_entries")
      .update({ is_approved: isApproved })
      .eq("id", entryId)
      .eq("memorial_id", memorialId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Guestbook update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/guestbook/[entryId] - Delete entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, entryId } = await params;

  if (DEMO_MODE) {
    return NextResponse.json({ deleted: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if user owns the memorial
    const { data: memorial } = await supabase
      .from("memorials")
      .select("user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("guestbook_entries")
      .delete()
      .eq("id", entryId)
      .eq("memorial_id", memorialId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Guestbook delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
