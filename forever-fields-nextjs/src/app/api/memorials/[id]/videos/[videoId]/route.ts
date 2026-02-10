// Individual Video API
// Update and delete memorial videos

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo videos store (shared)
const demoVideos: Map<string, Array<{
  id: string;
  memorialId: string;
  title: string | null;
  description: string | null;
  [key: string]: unknown;
}>> = new Map();

// PATCH /api/memorials/[id]/videos/[videoId] - Update a video
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { id: memorialId, videoId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    if (DEMO_MODE) {
      const videos = demoVideos.get(memorialId) || [];
      const index = videos.findIndex((v) => v.id === videoId);

      if (index === -1) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      videos[index] = {
        ...videos[index],
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      };

      demoVideos.set(memorialId, videos);
      return NextResponse.json({ video: videos[index] });
    }

    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: video } = await supabase
      .from("videos")
      .select("*, memorial:memorials(user_id)")
      .eq("id", videoId)
      .single();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const isOwner = video.memorial?.user_id === user.id || video.uploaded_by === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const { data: updatedVideo, error } = await supabase
      .from("videos")
      .update(updates)
      .eq("id", videoId)
      .select()
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    return NextResponse.json({ video: updatedVideo });
  } catch (error) {
    console.error("Video update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/videos/[videoId] - Delete a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const { id: memorialId, videoId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const videos = demoVideos.get(memorialId) || [];
    const filtered = videos.filter((v) => v.id !== videoId);
    demoVideos.set(memorialId, filtered);
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: video } = await supabase
      .from("videos")
      .select("*, memorial:memorials(user_id)")
      .eq("id", videoId)
      .single();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const isOwner = video.memorial?.user_id === user.id || video.uploaded_by === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      console.error("Error deleting video:", error);
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
