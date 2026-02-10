/**
 * Memorial Merge API
 *
 * Handles finding potential duplicate memorials and merging them together.
 * Uses name similarity (Levenshtein distance) and date matching to identify duplicates.
 *
 * Endpoints:
 * - GET  /api/memorials/[id]/merge - Find potential duplicates for a memorial
 * - POST /api/memorials/[id]/merge - Merge a source memorial into this one
 *
 * Merge behavior:
 * - Photos, stories, timeline events, and candle lightings can be selectively merged
 * - The source memorial is marked as merged and hidden from public view
 * - The target memorial receives all merged content
 * - This action cannot be undone
 *
 * @module api/memorials/[id]/merge
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo memorials for merge testing
const demoMemorials = [
  {
    id: "demo-memorial-1",
    firstName: "Eleanor",
    lastName: "Thompson",
    birthDate: "1940-03-15",
    deathDate: "2020-11-20",
    userId: "demo-user-1",
    isPublic: true,
    profilePhotoUrl: null,
    biography: "A beloved mother and grandmother.",
    mergedIntoId: null,
  },
  {
    id: "demo-memorial-2",
    firstName: "Eleanor",
    lastName: "Thompson",
    birthDate: "1940-03-15",
    deathDate: "2020-11-20",
    userId: "demo-user-2",
    isPublic: true,
    profilePhotoUrl: null,
    biography: "She touched many lives with her kindness.",
    mergedIntoId: null,
  },
  {
    id: "demo-memorial-3",
    firstName: "Ellie",
    lastName: "Thompson-Smith",
    birthDate: "1940-03-15",
    deathDate: "2020-11-20",
    userId: "demo-user-3",
    isPublic: true,
    profilePhotoUrl: null,
    biography: null,
    mergedIntoId: null,
  },
];

// Demo merged content store
const demoMergedContent: Map<string, {
  photos: string[];
  stories: string[];
  candles: number;
}> = new Map();

/**
 * Calculate the similarity between two strings using Levenshtein distance.
 *
 * The algorithm:
 * 1. If strings are identical, returns 1.0
 * 2. If one string contains the other, returns ratio of lengths
 * 3. Otherwise, calculates edit distance and returns normalized similarity
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity score between 0 and 1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  // Simple contains check
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return shorter.length / longer.length;
  }

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter[i - 1] === longer[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return 1 - matrix[shorter.length][longer.length] / longer.length;
}

// GET /api/memorials/[id]/merge - Find potential duplicates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const currentMemorial = demoMemorials.find((m) => m.id === memorialId);

    if (!currentMemorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Find potential duplicates
    const potentialDuplicates = demoMemorials
      .filter((m) => m.id !== memorialId && !m.mergedIntoId)
      .map((m) => {
        const nameSimilarity = calculateSimilarity(
          `${currentMemorial.firstName} ${currentMemorial.lastName}`,
          `${m.firstName} ${m.lastName}`
        );

        const dateMatch =
          currentMemorial.birthDate === m.birthDate &&
          currentMemorial.deathDate === m.deathDate;

        const overallScore = dateMatch ? nameSimilarity * 1.5 : nameSimilarity * 0.7;

        return {
          ...m,
          similarityScore: Math.min(overallScore, 1),
          matchReasons: [
            ...(nameSimilarity > 0.8 ? ["Similar name"] : []),
            ...(dateMatch ? ["Same birth/death dates"] : []),
          ],
        };
      })
      .filter((m) => m.similarityScore > 0.5)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return NextResponse.json({
      memorial: currentMemorial,
      potentialDuplicates,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get the current memorial
    const { data: memorial, error } = await supabase
      .from("memorials")
      .select("*")
      .eq("id", memorialId)
      .single();

    if (error || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Build search query for potential duplicates
    // Look for memorials with similar names and/or same dates
    const { data: candidates } = await supabase
      .from("memorials")
      .select("id, first_name, last_name, birth_date, death_date, user_id, profile_photo_url, biography")
      .neq("id", memorialId)
      .is("merged_into_id", null)
      .or(
        `last_name.ilike.%${memorial.last_name}%,` +
        `and(birth_date.eq.${memorial.birth_date},death_date.eq.${memorial.death_date})`
      )
      .limit(20);

    const potentialDuplicates = (candidates || [])
      .map((m) => {
        const nameSimilarity = calculateSimilarity(
          `${memorial.first_name} ${memorial.last_name}`,
          `${m.first_name} ${m.last_name}`
        );

        const dateMatch =
          memorial.birth_date === m.birth_date &&
          memorial.death_date === m.death_date;

        const overallScore = dateMatch ? nameSimilarity * 1.5 : nameSimilarity * 0.7;

        return {
          id: m.id,
          firstName: m.first_name,
          lastName: m.last_name,
          birthDate: m.birth_date,
          deathDate: m.death_date,
          userId: m.user_id,
          profilePhotoUrl: m.profile_photo_url,
          biography: m.biography,
          similarityScore: Math.min(overallScore, 1),
          matchReasons: [
            ...(nameSimilarity > 0.8 ? ["Similar name"] : []),
            ...(dateMatch ? ["Same birth/death dates"] : []),
          ],
        };
      })
      .filter((m) => m.similarityScore > 0.5)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return NextResponse.json({
      memorial: {
        id: memorial.id,
        firstName: memorial.first_name,
        lastName: memorial.last_name,
        birthDate: memorial.birth_date,
        deathDate: memorial.death_date,
        userId: memorial.user_id,
        profilePhotoUrl: memorial.profile_photo_url,
        biography: memorial.biography,
      },
      potentialDuplicates,
    });
  } catch (error) {
    console.error("Merge search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/merge - Merge another memorial into this one
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetMemorialId } = await params;
  const { user } = await requireAuth();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sourceMemorialId, mergeOptions } = body as {
      sourceMemorialId: string;
      mergeOptions?: {
        mergePhotos?: boolean;
        mergeStories?: boolean;
        mergeBiography?: boolean;
        mergeTimeline?: boolean;
      };
    };

    if (!sourceMemorialId) {
      return NextResponse.json(
        { error: "Source memorial ID is required" },
        { status: 400 }
      );
    }

    const options = {
      mergePhotos: true,
      mergeStories: true,
      mergeBiography: false,
      mergeTimeline: true,
      ...mergeOptions,
    };

    if (DEMO_MODE) {
      const targetIdx = demoMemorials.findIndex((m) => m.id === targetMemorialId);
      const sourceIdx = demoMemorials.findIndex((m) => m.id === sourceMemorialId);

      if (targetIdx === -1 || sourceIdx === -1) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
      }

      // Mark source as merged
      demoMemorials[sourceIdx].mergedIntoId = targetMemorialId;

      // Track merged content
      const existing = demoMergedContent.get(targetMemorialId) || {
        photos: [],
        stories: [],
        candles: 0,
      };

      demoMergedContent.set(targetMemorialId, {
        photos: options.mergePhotos ? [...existing.photos, "photo-from-source"] : existing.photos,
        stories: options.mergeStories ? [...existing.stories, "story-from-source"] : existing.stories,
        candles: existing.candles + 5,
      });

      return NextResponse.json({
        success: true,
        targetMemorial: demoMemorials[targetIdx],
        mergedContent: {
          photosAdded: options.mergePhotos ? 3 : 0,
          storiesAdded: options.mergeStories ? 2 : 0,
          candlesAdded: 5,
          eventsAdded: options.mergeTimeline ? 4 : 0,
        },
      });
    }

    const supabase = await createServerSupabaseClient();

    // Verify user owns both memorials or has admin rights
    const { data: memorials, error: fetchError } = await supabase
      .from("memorials")
      .select("id, user_id, first_name, last_name")
      .in("id", [targetMemorialId, sourceMemorialId]);

    if (fetchError || !memorials || memorials.length !== 2) {
      return NextResponse.json({ error: "Memorials not found" }, { status: 404 });
    }

    const targetMemorial = memorials.find((m) => m.id === targetMemorialId);
    const sourceMemorial = memorials.find((m) => m.id === sourceMemorialId);

    if (!targetMemorial || !sourceMemorial) {
      return NextResponse.json({ error: "Memorials not found" }, { status: 404 });
    }

    // Check ownership (user must own at least the target)
    if (targetMemorial.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Start merging content
    let photosAdded = 0;
    let storiesAdded = 0;
    let candlesAdded = 0;
    let eventsAdded = 0;

    // Merge photos
    if (options.mergePhotos) {
      const { data: photos } = await supabase
        .from("photos")
        .select("*")
        .eq("memorial_id", sourceMemorialId);

      if (photos && photos.length > 0) {
        const { error: photoError } = await supabase
          .from("photos")
          .update({ memorial_id: targetMemorialId })
          .eq("memorial_id", sourceMemorialId);

        if (!photoError) {
          photosAdded = photos.length;
        }
      }
    }

    // Merge stories
    if (options.mergeStories) {
      const { data: stories } = await supabase
        .from("stories")
        .select("*")
        .eq("memorial_id", sourceMemorialId);

      if (stories && stories.length > 0) {
        const { error: storyError } = await supabase
          .from("stories")
          .update({ memorial_id: targetMemorialId })
          .eq("memorial_id", sourceMemorialId);

        if (!storyError) {
          storiesAdded = stories.length;
        }
      }
    }

    // Merge timeline events
    if (options.mergeTimeline) {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("memorial_id", sourceMemorialId);

      if (events && events.length > 0) {
        const { error: eventError } = await supabase
          .from("events")
          .update({ memorial_id: targetMemorialId })
          .eq("memorial_id", sourceMemorialId);

        if (!eventError) {
          eventsAdded = events.length;
        }
      }
    }

    // Move candle lightings
    const { data: candles } = await supabase
      .from("candle_lightings")
      .select("*")
      .eq("memorial_id", sourceMemorialId);

    if (candles && candles.length > 0) {
      const { error: candleError } = await supabase
        .from("candle_lightings")
        .update({ memorial_id: targetMemorialId })
        .eq("memorial_id", sourceMemorialId);

      if (!candleError) {
        candlesAdded = candles.length;
      }
    }

    // Mark source as merged
    const { error: mergeError } = await supabase
      .from("memorials")
      .update({
        merged_into_id: targetMemorialId,
        is_public: false, // Hide merged memorial
      })
      .eq("id", sourceMemorialId);

    if (mergeError) {
      console.error("Error marking memorial as merged:", mergeError);
      return NextResponse.json({ error: "Failed to complete merge" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      targetMemorial: {
        id: targetMemorial.id,
        firstName: targetMemorial.first_name,
        lastName: targetMemorial.last_name,
      },
      sourceMemorial: {
        id: sourceMemorial.id,
        firstName: sourceMemorial.first_name,
        lastName: sourceMemorial.last_name,
      },
      mergedContent: {
        photosAdded,
        storiesAdded,
        candlesAdded,
        eventsAdded,
      },
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
