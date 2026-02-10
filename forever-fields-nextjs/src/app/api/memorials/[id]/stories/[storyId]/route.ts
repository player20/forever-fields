// Individual Story API
// Update, approve, feature, and delete stories

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Reference to demo stories (shared with parent route)
const demoStories: Map<string, Array<{
  id: string;
  memorialId: string;
  authorId: string | null;
  authorName: string;
  authorRelationship: string | null;
  title: string;
  content: string;
  mediaUrls: string[];
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}>> = new Map();

// GET /api/memorials/[id]/stories/[storyId] - Get single story
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const { id: memorialId, storyId } = await params;
  const { user } = await optionalAuth();

  if (DEMO_MODE) {
    const stories = demoStories.get(memorialId) || [];
    const story = stories.find((s) => s.id === storyId);

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Non-approved stories only visible to author or authenticated users
    if (!story.isApproved && story.authorId !== user?.id && !user) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ story });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: story, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("memorial_id", memorialId)
      .single();

    if (error || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check visibility
    if (!story.is_approved) {
      const { data: memorial } = await supabase
        .from("memorials")
        .select("user_id")
        .eq("id", memorialId)
        .single();

      const isOwner = user?.id === memorial?.user_id;
      const isAuthor = user?.id === story.author_id;

      if (!isOwner && !isAuthor) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Story fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/memorials/[id]/stories/[storyId] - Update story
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, storyId } = await params;
  const body = await request.json();

  // Whitelist allowed fields
  const allowedFields = [
    "title",
    "content",
    "author_relationship",
    "media_urls",
    "is_approved",
    "is_featured",
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

  if (DEMO_MODE) {
    const stories = demoStories.get(memorialId) || [];
    const storyIndex = stories.findIndex((s) => s.id === storyId);

    if (storyIndex === -1) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const updatedStory = {
      ...stories[storyIndex],
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [
          k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
          v,
        ])
      ),
      updatedAt: new Date().toISOString(),
    };

    stories[storyIndex] = updatedStory;
    demoStories.set(memorialId, stories);

    return NextResponse.json({ story: updatedStory });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check authorization - must be memorial owner or story author
    const { data: memorial } = await supabase
      .from("memorials")
      .select("user_id")
      .eq("id", memorialId)
      .single();

    const { data: existingStory } = await supabase
      .from("stories")
      .select("author_id")
      .eq("id", storyId)
      .single();

    const isOwner = user.id === memorial?.user_id;
    const isAuthor = user.id === existingStory?.author_id;

    // Only owner can approve/feature, author can edit content
    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Authors can't approve/feature their own stories
    if (!isOwner && (updates.is_approved !== undefined || updates.is_featured !== undefined)) {
      delete updates.is_approved;
      delete updates.is_featured;
    }

    updates.updated_at = new Date().toISOString();

    const { data: story, error } = await supabase
      .from("stories")
      .update(updates)
      .eq("id", storyId)
      .eq("memorial_id", memorialId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "Failed to update story" }, { status: 500 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Story update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/stories/[storyId] - Delete story
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId, storyId } = await params;

  if (DEMO_MODE) {
    const stories = demoStories.get(memorialId) || [];
    const filtered = stories.filter((s) => s.id !== storyId);
    demoStories.set(memorialId, filtered);
    return NextResponse.json({ deleted: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check authorization
    const { data: memorial } = await supabase
      .from("memorials")
      .select("user_id")
      .eq("id", memorialId)
      .single();

    const { data: story } = await supabase
      .from("stories")
      .select("author_id")
      .eq("id", storyId)
      .single();

    const isOwner = user.id === memorial?.user_id;
    const isAuthor = user.id === story?.author_id;

    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId)
      .eq("memorial_id", memorialId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Story delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
