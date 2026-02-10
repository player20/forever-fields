// Individual Playlist Item API
// Update and delete tribute playlist items

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo playlist store (Note: Each route module has its own instance in serverless environments)
const demoPlaylists: Map<string, Array<{
  id: string;
  memorialId: string;
  title: string;
  artist: string | null;
  albumArt: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceId: string | null;
  audioUrl: string | null;
  duration: number | null;
  sortOrder: number;
  addedBy: string | null;
  createdAt: string;
}>> = new Map();

// PATCH /api/memorials/[id]/playlist/[itemId] - Update a playlist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: memorialId, itemId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, artist, albumArt, duration } = body as {
      title?: string;
      artist?: string;
      albumArt?: string;
      duration?: number;
    };

    if (DEMO_MODE) {
      const playlist = demoPlaylists.get(memorialId) || [];
      const index = playlist.findIndex((t) => t.id === itemId);

      if (index === -1) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }

      playlist[index] = {
        ...playlist[index],
        ...(title !== undefined && { title }),
        ...(artist !== undefined && { artist }),
        ...(albumArt !== undefined && { albumArt }),
        ...(duration !== undefined && { duration }),
      };

      demoPlaylists.set(memorialId, playlist);
      return NextResponse.json({ item: playlist[index] });
    }

    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (artist !== undefined) updates.artist = artist;
    if (albumArt !== undefined) updates.album_art = albumArt;
    if (duration !== undefined) updates.duration = duration;

    const { data: item, error } = await supabase
      .from("tribute_playlist_items")
      .update(updates)
      .eq("id", itemId)
      .eq("memorial_id", memorialId)
      .select()
      .single();

    if (error) {
      console.error("Error updating track:", error);
      return NextResponse.json({ error: "Failed to update track" }, { status: 500 });
    }

    return NextResponse.json({
      item: {
        id: item.id,
        memorialId: item.memorial_id,
        title: item.title,
        artist: item.artist,
        albumArt: item.album_art,
        sourceType: item.source_type,
        sourceUrl: item.source_url,
        sourceId: item.source_id,
        audioUrl: item.audio_url,
        duration: item.duration,
        sortOrder: item.sort_order,
        addedBy: item.added_by,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error("Playlist item update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/playlist/[itemId] - Delete a playlist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: memorialId, itemId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const playlist = demoPlaylists.get(memorialId) || [];
    const filtered = playlist.filter((t) => t.id !== itemId);
    demoPlaylists.set(memorialId, filtered);
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial || memorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("tribute_playlist_items")
      .delete()
      .eq("id", itemId)
      .eq("memorial_id", memorialId);

    if (error) {
      console.error("Error deleting track:", error);
      return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Playlist item delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
