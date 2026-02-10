/**
 * Tribute Playlist API for Memorials
 *
 * Manages music tributes from various sources including Spotify, YouTube,
 * Apple Music, SoundCloud, and direct uploads.
 *
 * Endpoints:
 * - GET  /api/memorials/[id]/playlist - List all playlist items
 * - POST /api/memorials/[id]/playlist - Add a new track
 * - PATCH /api/memorials/[id]/playlist - Reorder playlist items
 *
 * @module api/memorials/[id]/playlist
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo playlist store
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

/**
 * Parse external music service URLs to extract the platform type and track ID.
 *
 * Supported platforms:
 * - Spotify (tracks, albums, playlists)
 * - YouTube (videos, shorts, embeds)
 * - Apple Music (albums/tracks)
 * - SoundCloud
 *
 * @param url - The music service URL to parse
 * @returns Object with type and id, or null if URL format not recognized
 */
function parseSourceUrl(url: string): { type: string; id: string | null } | null {
  // Spotify
  const spotifyMatch = url.match(/spotify\.com\/(?:track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    return { type: "spotify", id: spotifyMatch[1] };
  }

  // YouTube
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { type: "youtube", id: match[1] };
    }
  }

  // Apple Music
  const appleMatch = url.match(/music\.apple\.com\/.+\/album\/.+\/(\d+)/);
  if (appleMatch) {
    return { type: "apple_music", id: appleMatch[1] };
  }

  // SoundCloud
  if (url.includes("soundcloud.com")) {
    return { type: "soundcloud", id: null };
  }

  return null;
}

// GET /api/memorials/[id]/playlist - Get playlist for a memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;

  if (DEMO_MODE) {
    let playlist = demoPlaylists.get(memorialId) || [];

    // Seed demo data if empty
    if (playlist.length === 0) {
      playlist = [
        {
          id: "track-1",
          memorialId,
          title: "What a Wonderful World",
          artist: "Louis Armstrong",
          albumArt: "https://picsum.photos/seed/album1/300/300",
          sourceType: "spotify",
          sourceUrl: "https://open.spotify.com/track/29U7stRjqHU6rMiS8BfaI9",
          sourceId: "29U7stRjqHU6rMiS8BfaI9",
          audioUrl: null,
          duration: 139,
          sortOrder: 0,
          addedBy: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        },
        {
          id: "track-2",
          memorialId,
          title: "Amazing Grace",
          artist: "Traditional",
          albumArt: "https://picsum.photos/seed/album2/300/300",
          sourceType: "youtube",
          sourceUrl: "https://www.youtube.com/watch?v=CDdvReNKKuk",
          sourceId: "CDdvReNKKuk",
          audioUrl: null,
          duration: 324,
          sortOrder: 1,
          addedBy: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
        {
          id: "track-3",
          memorialId,
          title: "My Way",
          artist: "Frank Sinatra",
          albumArt: "https://picsum.photos/seed/album3/300/300",
          sourceType: "spotify",
          sourceUrl: "https://open.spotify.com/track/3spdoTYpuCpmq19tuD0bOe",
          sourceId: "3spdoTYpuCpmq19tuD0bOe",
          audioUrl: null,
          duration: 277,
          sortOrder: 2,
          addedBy: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
      ];
      demoPlaylists.set(memorialId, playlist);
    }

    const sorted = [...playlist].sort((a, b) => a.sortOrder - b.sortOrder);

    return NextResponse.json({
      items: sorted,
      total: sorted.length,
      totalDuration: sorted.reduce((sum, t) => sum + (t.duration || 0), 0),
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get playlist items
    const { data: items, error } = await supabase
      .from("tribute_playlist_items")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching playlist:", error);
      return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
    }

    const totalDuration = (items || []).reduce((sum, t) => sum + (t.duration || 0), 0);

    return NextResponse.json({
      items: (items || []).map((item) => ({
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
      })),
      total: items?.length || 0,
      totalDuration,
    });
  } catch (error) {
    console.error("Playlist fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/playlist - Add a track to the playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  try {
    const body = await request.json();
    const {
      title,
      artist,
      albumArt,
      sourceUrl,
      sourceType: providedType,
      duration,
      audioUrl,
    } = body as {
      title: string;
      artist?: string;
      albumArt?: string;
      sourceUrl: string;
      sourceType?: string;
      duration?: number;
      audioUrl?: string;
    };

    if (!title || !sourceUrl) {
      return NextResponse.json(
        { error: "Title and source URL are required" },
        { status: 400 }
      );
    }

    // Parse source URL to determine type and ID
    const parsed = parseSourceUrl(sourceUrl);
    const sourceType = providedType || parsed?.type || "custom";
    const sourceId = parsed?.id || null;

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const playlist = demoPlaylists.get(memorialId) || [];
      const maxOrder = playlist.reduce((max, t) => Math.max(max, t.sortOrder), -1);

      const newItem = {
        id: `track-${Date.now()}`,
        memorialId,
        title,
        artist: artist || null,
        albumArt: albumArt || null,
        sourceType,
        sourceUrl,
        sourceId,
        audioUrl: audioUrl || null,
        duration: duration || null,
        sortOrder: maxOrder + 1,
        addedBy: user?.id || null,
        createdAt: now,
      };

      demoPlaylists.set(memorialId, [...playlist, newItem]);

      return NextResponse.json({ item: newItem }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Get max sort order
    const { data: existing } = await supabase
      .from("tribute_playlist_items")
      .select("sort_order")
      .eq("memorial_id", memorialId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxOrder = existing?.[0]?.sort_order ?? -1;

    const { data: item, error } = await supabase
      .from("tribute_playlist_items")
      .insert({
        memorial_id: memorialId,
        title,
        artist: artist || null,
        album_art: albumArt || null,
        source_type: sourceType,
        source_url: sourceUrl,
        source_id: sourceId,
        audio_url: audioUrl || null,
        duration: duration || null,
        sort_order: maxOrder + 1,
        added_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding track:", error);
      return NextResponse.json({ error: "Failed to add track" }, { status: 500 });
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
    }, { status: 201 });
  } catch (error) {
    console.error("Playlist add error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/memorials/[id]/playlist - Reorder playlist items
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { order } = body as { order: string[] }; // Array of item IDs in new order

    if (!order || !Array.isArray(order)) {
      return NextResponse.json({ error: "Order array is required" }, { status: 400 });
    }

    if (DEMO_MODE) {
      const playlist = demoPlaylists.get(memorialId) || [];
      const reordered = order.map((id, index) => {
        const item = playlist.find((t) => t.id === id);
        if (item) {
          return { ...item, sortOrder: index };
        }
        return null;
      }).filter(Boolean) as typeof playlist;

      demoPlaylists.set(memorialId, reordered);

      return NextResponse.json({ success: true, items: reordered });
    }

    const supabase = await createServerSupabaseClient();

    // Update each item's sort order
    const updates = order.map((id, index) =>
      supabase
        .from("tribute_playlist_items")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("memorial_id", memorialId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Playlist reorder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
