// Individual Photo API
// Update and delete single photos

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// PATCH /api/memorials/[id]/photos/[photoId] - Update photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, photoId } = await params;
  const body = await request.json();

  // Whitelist allowed fields
  const allowedFields = ["caption", "estimated_decade", "is_profile_photo", "sort_order"];
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

  if (DEMO_MODE) {
    return NextResponse.json({
      photo: { id: photoId, memorialId, ...updates, updatedAt: new Date().toISOString() },
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: photo, error } = await supabase
      .from("photos")
      .update(updates)
      .eq("id", photoId)
      .eq("memorial_id", memorialId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
    }

    // If setting as profile photo, update memorial and unset others
    if (updates.is_profile_photo === true) {
      // Unset other profile photos
      await supabase
        .from("photos")
        .update({ is_profile_photo: false })
        .eq("memorial_id", memorialId)
        .neq("id", photoId);

      // Update memorial profile photo URL
      await supabase
        .from("memorials")
        .update({ profile_photo_url: photo.url })
        .eq("id", memorialId);
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Photo update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/photos/[photoId] - Delete single photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, photoId } = await params;

  if (DEMO_MODE) {
    return NextResponse.json({ deleted: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get photo to find storage path
    const { data: photo } = await supabase
      .from("photos")
      .select("url, is_profile_photo")
      .eq("id", photoId)
      .eq("memorial_id", memorialId)
      .single();

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Extract storage path from URL
    const match = photo.url.match(/memorial-photos\/(.+)$/);
    if (match) {
      await supabase.storage.from("memorial-photos").remove([match[1]]);
    }

    // Delete from database
    const { error } = await supabase
      .from("photos")
      .delete()
      .eq("id", photoId)
      .eq("memorial_id", memorialId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
    }

    // If this was the profile photo, clear it from memorial
    if (photo.is_profile_photo) {
      await supabase
        .from("memorials")
        .update({ profile_photo_url: null })
        .eq("id", memorialId);
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
