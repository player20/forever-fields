// Time Capsules API for memorials
// Create and manage scheduled content reveals

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo time capsules store
const demoTimeCapsules: Map<string, Array<{
  id: string;
  memorialId: string;
  createdById: string;
  createdByName: string;
  title: string;
  message: string | null;
  mediaUrls: string[];
  unlockDate: string;
  unlockType: "date" | "anniversary" | "milestone";
  isUnlocked: boolean;
  unlockedAt: string | null;
  recipientEmails: string[];
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}>> = new Map();

// GET /api/memorials/[id]/time-capsules - List time capsules
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();
  const { searchParams } = new URL(request.url);
  const includeUnrevealed = searchParams.get("all") === "true";
  const now = new Date();

  if (DEMO_MODE) {
    let capsules = demoTimeCapsules.get(memorialId) || [];

    // Check for newly unlocked capsules
    capsules = capsules.map((c) => {
      if (!c.isUnlocked && new Date(c.unlockDate) <= now) {
        return { ...c, isUnlocked: true, unlockedAt: now.toISOString() };
      }
      return c;
    });
    demoTimeCapsules.set(memorialId, capsules);

    // Filter based on permissions
    if (!user && !includeUnrevealed) {
      capsules = capsules.filter((c) => c.isUnlocked);
    }

    // For public view, redact content of locked capsules
    const safeCapsules = capsules.map((c) => {
      if (!c.isUnlocked && !user) {
        return {
          ...c,
          message: null,
          mediaUrls: [],
        };
      }
      return c;
    });

    return NextResponse.json({
      timeCapsules: safeCapsules,
      total: capsules.length,
      unlocked: capsules.filter((c) => c.isUnlocked).length,
      pending: capsules.filter((c) => !c.isUnlocked).length,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is memorial owner
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    const isOwner = user?.id === memorial.user_id;

    // Get all capsules
    const query = supabase
      .from("time_capsules")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("unlock_date", { ascending: true });

    const { data: capsules, error } = await query;

    if (error) {
      console.error("Error fetching time capsules:", error);
      return NextResponse.json({ error: "Failed to fetch time capsules" }, { status: 500 });
    }

    // Update unlocked status for any that have passed their date
    const updatePromises = (capsules || [])
      .filter((c) => !c.is_unlocked && new Date(c.unlock_date) <= now)
      .map((c) =>
        supabase
          .from("time_capsules")
          .update({ is_unlocked: true, unlocked_at: now.toISOString() })
          .eq("id", c.id)
      );

    await Promise.all(updatePromises);

    // Prepare response
    let responseCapsules = capsules || [];

    // Update local state with unlocked status
    responseCapsules = responseCapsules.map((c) => ({
      ...c,
      is_unlocked: c.is_unlocked || new Date(c.unlock_date) <= now,
      unlocked_at: c.unlocked_at || (new Date(c.unlock_date) <= now ? now.toISOString() : null),
    }));

    // For non-owners, filter or redact locked capsules
    if (!isOwner) {
      if (!includeUnrevealed) {
        responseCapsules = responseCapsules.filter((c) => c.is_unlocked);
      } else {
        responseCapsules = responseCapsules.map((c) => {
          if (!c.is_unlocked) {
            return { ...c, message: null, media_urls: [] };
          }
          return c;
        });
      }
    }

    return NextResponse.json({
      timeCapsules: responseCapsules,
      total: capsules?.length || 0,
      unlocked: responseCapsules.filter((c) => c.is_unlocked).length,
      pending: responseCapsules.filter((c) => !c.is_unlocked).length,
    });
  } catch (error) {
    console.error("Time capsules fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/time-capsules - Create a time capsule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId } = await params;

  try {
    const body = await request.json();
    const {
      title,
      message,
      mediaUrls,
      unlockDate,
      unlockType = "date",
      recipientEmails,
      createdByName,
    } = body;

    if (!title || !unlockDate) {
      return NextResponse.json(
        { error: "Title and unlock date are required" },
        { status: 400 }
      );
    }

    // Validate unlock date is in the future
    const unlock = new Date(unlockDate);
    if (unlock <= new Date()) {
      return NextResponse.json(
        { error: "Unlock date must be in the future" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const capsule = {
        id: `capsule-${Date.now()}`,
        memorialId,
        createdById: user.id,
        createdByName: createdByName || user.email || "Anonymous",
        title,
        message: message || null,
        mediaUrls: mediaUrls || [],
        unlockDate: unlock.toISOString(),
        unlockType: unlockType as "date" | "anniversary" | "milestone",
        isUnlocked: false,
        unlockedAt: null,
        recipientEmails: recipientEmails || [],
        notificationSent: false,
        createdAt: now,
        updatedAt: now,
      };

      const existing = demoTimeCapsules.get(memorialId) || [];
      demoTimeCapsules.set(memorialId, [capsule, ...existing]);

      return NextResponse.json({ timeCapsule: capsule }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if memorial exists
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    const { data: capsule, error } = await supabase
      .from("time_capsules")
      .insert({
        memorial_id: memorialId,
        created_by_id: user.id,
        created_by_name: createdByName || user.email,
        title,
        message: message || null,
        media_urls: mediaUrls || [],
        unlock_date: unlock.toISOString(),
        unlock_type: unlockType,
        is_unlocked: false,
        recipient_emails: recipientEmails || [],
        notification_sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating time capsule:", error);
      return NextResponse.json({ error: "Failed to create time capsule" }, { status: 500 });
    }

    return NextResponse.json({ timeCapsule: capsule }, { status: 201 });
  } catch (error) {
    console.error("Time capsule create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
