// Stories API for memorials
// CRUD operations for family stories and memories

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { getMemorial, addStory } from "@/lib/demo-store";

// GET /api/memorials/[id]/stories - List stories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";

  if (DEMO_MODE) {
    const memorial = getMemorial(memorialId);
    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Map stories from persistent store
    let stories = memorial.stories.map((s) => ({
      id: s.id,
      memorialId,
      authorId: null,
      authorName: s.author,
      authorRelationship: s.relationship,
      title: s.title,
      content: s.content,
      mediaUrls: [],
      isApproved: true,
      isFeatured: false,
      createdAt: s.created_at,
      updatedAt: s.created_at,
    }));

    if (featured) {
      stories = stories.filter((s) => s.isFeatured);
    }

    return NextResponse.json({
      stories,
      total: stories.length,
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

    let query = supabase
      .from("stories")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });

    // Only show approved stories to non-owners
    if (!isOwner) {
      query = query.eq("is_approved", true);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    const { data: stories, error } = await query;

    if (error) {
      console.error("Error fetching stories:", error);
      return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }

    return NextResponse.json({
      stories: stories || [],
      total: stories?.length || 0,
    });
  } catch (error) {
    console.error("Stories fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/stories - Create a story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await optionalAuth();

  try {
    const body = await request.json();
    const { title, content, authorName, authorRelationship, mediaUrls } = body;

    if (!title || !content || !authorName) {
      return NextResponse.json(
        { error: "Title, content, and author name are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (DEMO_MODE) {
      const storyData = {
        id: `story-${Date.now()}`,
        title,
        content,
        author: authorName,
        relationship: authorRelationship || null,
        created_at: now,
      };

      const memorial = addStory(memorialId, storyData);
      if (!memorial) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
      }

      return NextResponse.json({
        story: {
          id: storyData.id,
          memorialId,
          authorId: user?.id || null,
          authorName,
          authorRelationship: authorRelationship || null,
          title,
          content,
          mediaUrls: mediaUrls || [],
          isApproved: true,
          isFeatured: false,
          createdAt: now,
          updatedAt: now,
        },
      }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if memorial exists
    const { data: memorial } = await supabase
      .from("memorials")
      .select("id, user_id")
      .eq("id", memorialId)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Auto-approve for memorial owner
    const isOwner = user?.id === memorial.user_id;

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        memorial_id: memorialId,
        author_id: user?.id || null,
        author_name: authorName,
        author_relationship: authorRelationship || null,
        title,
        content,
        media_urls: mediaUrls || [],
        is_approved: isOwner || !!user, // Auto-approve for authenticated users
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating story:", error);
      return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
    }

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("Story create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
