// Individual Time Capsule API
// View, update, and delete time capsules

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Reference to demo time capsules (shared with parent route)
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

// GET /api/memorials/[id]/time-capsules/[capsuleId] - Get single time capsule
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; capsuleId: string }> }
) {
  const { id: memorialId, capsuleId } = await params;
  const { user } = await optionalAuth();
  const now = new Date();

  if (DEMO_MODE) {
    const capsules = demoTimeCapsules.get(memorialId) || [];
    let capsule = capsules.find((c) => c.id === capsuleId);

    if (!capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Check if newly unlocked
    if (!capsule.isUnlocked && new Date(capsule.unlockDate) <= now) {
      capsule = { ...capsule, isUnlocked: true, unlockedAt: now.toISOString() };
      const idx = capsules.findIndex((c) => c.id === capsuleId);
      capsules[idx] = capsule;
      demoTimeCapsules.set(memorialId, capsules);
    }

    // Redact content if locked and not creator
    if (!capsule.isUnlocked && capsule.createdById !== user?.id) {
      return NextResponse.json({
        timeCapsule: {
          ...capsule,
          message: null,
          mediaUrls: [],
        },
      });
    }

    return NextResponse.json({ timeCapsule: capsule });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: capsule, error } = await supabase
      .from("time_capsules")
      .select("*")
      .eq("id", capsuleId)
      .eq("memorial_id", memorialId)
      .single();

    if (error || !capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Check if should be unlocked
    const isUnlocked = capsule.is_unlocked || new Date(capsule.unlock_date) <= now;

    if (!capsule.is_unlocked && isUnlocked) {
      // Update database
      await supabase
        .from("time_capsules")
        .update({ is_unlocked: true, unlocked_at: now.toISOString() })
        .eq("id", capsuleId);
    }

    // Check authorization for locked capsules
    if (!isUnlocked) {
      const { data: memorial } = await supabase
        .from("memorials")
        .select("user_id")
        .eq("id", memorialId)
        .single();

      const isOwner = user?.id === memorial?.user_id;
      const isCreator = user?.id === capsule.created_by_id;

      // Only owner or creator can see locked content
      if (!isOwner && !isCreator) {
        return NextResponse.json({
          timeCapsule: {
            ...capsule,
            message: null,
            media_urls: [],
            is_unlocked: false,
          },
        });
      }
    }

    return NextResponse.json({
      timeCapsule: {
        ...capsule,
        is_unlocked: isUnlocked,
        unlocked_at: isUnlocked ? (capsule.unlocked_at || now.toISOString()) : null,
      },
    });
  } catch (error) {
    console.error("Time capsule fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/memorials/[id]/time-capsules/[capsuleId] - Update time capsule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; capsuleId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, capsuleId } = await params;
  const body = await request.json();

  // Only allow updates to locked capsules
  const allowedFields = [
    "title",
    "message",
    "media_urls",
    "unlock_date",
    "unlock_type",
    "recipient_emails",
  ];

  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (camelField in body) {
      updates[field] = body[camelField];
    } else if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate unlock_date if provided
  if (updates.unlock_date) {
    const unlock = new Date(updates.unlock_date as string);
    if (unlock <= new Date()) {
      return NextResponse.json(
        { error: "Unlock date must be in the future" },
        { status: 400 }
      );
    }
  }

  if (DEMO_MODE) {
    const capsules = demoTimeCapsules.get(memorialId) || [];
    const capsuleIndex = capsules.findIndex((c) => c.id === capsuleId);

    if (capsuleIndex === -1) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    const capsule = capsules[capsuleIndex];

    // Only creator can edit
    if (capsule.createdById !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't edit unlocked capsules
    if (capsule.isUnlocked) {
      return NextResponse.json(
        { error: "Cannot edit an unlocked time capsule" },
        { status: 400 }
      );
    }

    const updatedCapsule = {
      ...capsule,
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [
          k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
          v,
        ])
      ),
      updatedAt: new Date().toISOString(),
    };

    capsules[capsuleIndex] = updatedCapsule;
    demoTimeCapsules.set(memorialId, capsules);

    return NextResponse.json({ timeCapsule: updatedCapsule });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get capsule to check authorization
    const { data: capsule } = await supabase
      .from("time_capsules")
      .select("created_by_id, is_unlocked")
      .eq("id", capsuleId)
      .eq("memorial_id", memorialId)
      .single();

    if (!capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Only creator can edit
    if (capsule.created_by_id !== user.id) {
      // Check if memorial owner
      const { data: memorial } = await supabase
        .from("memorials")
        .select("user_id")
        .eq("id", memorialId)
        .single();

      if (user.id !== memorial?.user_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Can't edit unlocked capsules
    if (capsule.is_unlocked) {
      return NextResponse.json(
        { error: "Cannot edit an unlocked time capsule" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("time_capsules")
      .update(updates)
      .eq("id", capsuleId)
      .eq("memorial_id", memorialId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update time capsule" }, { status: 500 });
    }

    return NextResponse.json({ timeCapsule: updated });
  } catch (error) {
    console.error("Time capsule update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/time-capsules/[capsuleId] - Delete time capsule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; capsuleId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, capsuleId } = await params;

  if (DEMO_MODE) {
    const capsules = demoTimeCapsules.get(memorialId) || [];
    const capsule = capsules.find((c) => c.id === capsuleId);

    if (!capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Only creator can delete (unless unlocked, then can't delete)
    if (capsule.createdById !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const filtered = capsules.filter((c) => c.id !== capsuleId);
    demoTimeCapsules.set(memorialId, filtered);

    return NextResponse.json({ deleted: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check authorization
    const { data: capsule } = await supabase
      .from("time_capsules")
      .select("created_by_id")
      .eq("id", capsuleId)
      .eq("memorial_id", memorialId)
      .single();

    if (!capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Only creator or memorial owner can delete
    if (capsule.created_by_id !== user.id) {
      const { data: memorial } = await supabase
        .from("memorials")
        .select("user_id")
        .eq("id", memorialId)
        .single();

      if (user.id !== memorial?.user_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from("time_capsules")
      .delete()
      .eq("id", capsuleId)
      .eq("memorial_id", memorialId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete time capsule" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Time capsule delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
