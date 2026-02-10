/**
 * Videos API for Memorials
 *
 * Manages video content for memorials, supporting both uploaded files and
 * embedded videos from YouTube/Vimeo.
 *
 * Endpoints:
 * - GET  /api/memorials/[id]/videos - List all ready videos
 * - POST /api/memorials/[id]/videos - Add a new video (upload or external link)
 *
 * Supported sources:
 * - Direct uploads (processed async, status: processing -> ready)
 * - YouTube videos (via URL, auto-extracts thumbnail)
 * - Vimeo videos (via URL)
 * - AI-generated tribute videos (future feature)
 *
 * @module api/memorials/[id]/videos
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo videos store
const demoVideos: Map<string, Array<{
  id: string;
  memorialId: string;
  uploadedBy: string | null;
  title: string | null;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  status: "processing" | "ready" | "failed";
  sourceType: "upload" | "youtube" | "vimeo" | "ai_generated";
  externalId: string | null;
  createdAt: string;
}>> = new Map();

// Seed demo videos
function seedDemoVideos(memorialId: string) {
  return [
    {
      id: "video-1",
      memorialId,
      uploadedBy: null,
      title: "Birthday Celebration 2019",
      description: "A wonderful gathering with the whole family",
      url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl: null,
      duration: 120,
      fileSize: 15000000,
      status: "ready" as const,
      sourceType: "upload" as const,
      externalId: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
    {
      id: "video-2",
      memorialId,
      uploadedBy: null,
      title: "Grandma's Garden Tour",
      description: "A tour of her beloved rose garden",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: 180,
      fileSize: null,
      status: "ready" as const,
      sourceType: "youtube" as const,
      externalId: "dQw4w9WgXcQ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
  ];
}

// GET /api/memorials/[id]/videos - List videos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;

  if (DEMO_MODE) {
    if (!demoVideos.has(memorialId)) {
      demoVideos.set(memorialId, seedDemoVideos(memorialId));
    }

    const videos = demoVideos.get(memorialId) || [];
    const readyVideos = videos.filter((v) => v.status === "ready");

    return NextResponse.json({
      videos: readyVideos,
      total: readyVideos.length,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: videos, error } = await supabase
      .from("videos")
      .select("*")
      .eq("memorial_id", memorialId)
      .eq("status", "ready")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json({
      videos: videos || [],
      total: videos?.length || 0,
    });
  } catch (error) {
    console.error("Videos fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/videos - Add a video
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
    const { title, description, url, sourceType, externalId, duration, thumbnailUrl } = body as {
      title?: string;
      description?: string;
      url: string;
      sourceType: "upload" | "youtube" | "vimeo";
      externalId?: string;
      duration?: number;
      thumbnailUrl?: string;
    };

    if (!url) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const video = {
        id: `video-${Date.now()}`,
        memorialId,
        uploadedBy: user.id,
        title: title || null,
        description: description || null,
        url,
        thumbnailUrl: thumbnailUrl || extractYouTubeThumbnail(url) || null,
        duration: duration || null,
        fileSize: null,
        status: "ready" as const,
        sourceType: sourceType || "upload",
        externalId: externalId || extractVideoId(url) || null,
        createdAt: now,
      };

      const existing = demoVideos.get(memorialId) || [];
      demoVideos.set(memorialId, [video, ...existing]);

      return NextResponse.json({ video }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify user has access to memorial
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check authorization (owner or collaborator)
    const isOwner = memorial.user_id === user.id;
    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("id")
        .eq("memorial_id", memorialId)
        .eq("user_id", user.id)
        .single();

      if (!collaborator) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    const { data: video, error } = await supabase
      .from("videos")
      .insert({
        memorial_id: memorialId,
        uploaded_by: user.id,
        title: title || null,
        description: description || null,
        url,
        thumbnail_url: thumbnailUrl || extractYouTubeThumbnail(url) || null,
        duration: duration || null,
        status: sourceType === "upload" ? "processing" : "ready",
        source_type: sourceType || "upload",
        external_id: externalId || extractVideoId(url) || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video:", error);
      return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("Video create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Extract the video ID from a YouTube or Vimeo URL.
 *
 * Supports multiple URL formats:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - youtube.com/shorts/ID
 * - vimeo.com/ID
 *
 * @param url - The video URL to parse
 * @returns The extracted video ID, or null if not found
 */
function extractVideoId(url: string): string | null {
  // YouTube patterns
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Vimeo pattern
  const vimeoPattern = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch) return vimeoMatch[1];

  return null;
}

// Helper to get YouTube thumbnail
function extractYouTubeThumbnail(url: string): string | null {
  const videoId = extractVideoId(url);
  if (videoId && (url.includes("youtube") || url.includes("youtu.be"))) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
}
