// Guestbook API for memorials
// Leave messages and condolences

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { getMemorial, addGuestbookEntry } from "@/lib/demo-store";

// GET /api/memorials/[id]/guestbook - List guestbook entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { searchParams } = new URL(request.url);
  const includeUnapproved = searchParams.get("includeUnapproved") === "true";

  if (DEMO_MODE) {
    const memorial = getMemorial(memorialId);
    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }
    const entries = memorial.guestbook_entries.map((e) => ({
      id: e.id,
      memorialId,
      authorName: e.name,
      message: e.message,
      isApproved: true,
      createdAt: e.created_at,
    }));
    return NextResponse.json({ entries });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("guestbook_entries")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });

    // Only show approved entries to public
    if (!includeUnapproved) {
      query = query.eq("is_approved", true);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error("Error fetching guestbook:", error);
      return NextResponse.json({ error: "Failed to fetch guestbook" }, { status: 500 });
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error("Guestbook fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/guestbook - Add guestbook entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  try {
    const body = await request.json();
    const { authorName, authorEmail, message } = body;

    // Validate required fields
    if (!authorName || !message) {
      return NextResponse.json(
        { error: "authorName and message are required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Maximum 2000 characters" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const now = new Date().toISOString();
      const entryData = {
        id: `entry-${Date.now()}`,
        name: authorName,
        message,
        created_at: now,
      };

      const memorial = addGuestbookEntry(memorialId, entryData);
      if (!memorial) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
      }

      return NextResponse.json({
        entry: {
          id: entryData.id,
          memorialId,
          authorName,
          authorEmail: authorEmail || null,
          message,
          isApproved: true,
          createdAt: now,
        },
      }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if memorial exists and allows guestbook
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, allow_guestbook, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    if (!memorial.allow_guestbook) {
      return NextResponse.json(
        { error: "Guestbook is disabled for this memorial" },
        { status: 403 }
      );
    }

    // Auto-approve if from owner or authenticated user
    const isOwner = user?.id === memorial.user_id;
    const isApproved = isOwner || !!user;

    const { data: entry, error } = await supabase
      .from("guestbook_entries")
      .insert({
        memorial_id: memorialId,
        author_name: authorName,
        author_email: authorEmail || null,
        message,
        is_approved: isApproved,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating entry:", error);
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Guestbook create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
