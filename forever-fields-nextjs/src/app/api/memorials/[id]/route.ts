import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Demo mode for local development without real Supabase credentials
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Demo memorials for CRUD operations
const DEMO_MEMORIALS: Record<string, {
  id: string;
  slug: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  birth_date: string;
  death_date: string;
  birth_place: string;
  resting_place: string;
  obituary: string | null;
  profile_photo_url: string | null;
  is_public: boolean;
  privacy_level: string;
  view_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  photos: { id: string; url: string; caption: string }[];
  stories: { id: string; title: string; content: string; author: string }[];
  guestbook_entries: { id: string; name: string; message: string; created_at: string }[];
  candle_lightings: { id: string; name: string; message: string; lit_at: string }[];
}> = {
  "demo-memorial-1": {
    id: "demo-memorial-1",
    slug: "margaret-rose-sullivan",
    first_name: "Margaret",
    middle_name: "Rose",
    last_name: "Sullivan",
    nickname: "Maggie",
    birth_date: "1935-06-15",
    death_date: "2023-11-28",
    birth_place: "Boston, MA",
    resting_place: "Oak Hill Cemetery, Boston",
    obituary: "Margaret Rose Sullivan, beloved mother, grandmother, and friend, passed peacefully surrounded by family. Known for her warm smile and legendary apple pie, Maggie touched countless lives with her kindness and generosity. She was a devoted volunteer at the local library for over 30 years and never missed a Sunday dinner with family.",
    profile_photo_url: null,
    is_public: true,
    privacy_level: "public",
    view_count: 342,
    user_id: "demo-user-123",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    photos: [
      { id: "p1", url: "/demo/photos/family-gathering.jpg", caption: "Family Christmas 2022" },
      { id: "p2", url: "/demo/photos/garden.jpg", caption: "In her beloved garden" },
      { id: "p3", url: "/demo/photos/wedding.jpg", caption: "Wedding day, 1958" },
    ],
    stories: [
      { id: "s1", title: "The Apple Pie Legacy", content: "Every Thanksgiving, Mom would start baking at 5am...", author: "Sarah Sullivan" },
      { id: "s2", title: "Library Adventures", content: "When I was little, Grandma would take me to the library every Saturday...", author: "Emily Chen" },
    ],
    guestbook_entries: [
      { id: "g1", name: "John Thompson", message: "Maggie was the kindest neighbor anyone could ask for.", created_at: "2024-01-10T09:00:00Z" },
      { id: "g2", name: "Mary Williams", message: "Her smile could light up any room. Rest in peace, dear friend.", created_at: "2024-01-12T14:30:00Z" },
    ],
    candle_lightings: [
      { id: "c1", name: "Sarah Sullivan", message: "Missing you always, Mom", lit_at: "2024-01-20T18:00:00Z" },
      { id: "c2", name: "Michael Sullivan", message: "Love you, Grandma", lit_at: "2024-01-21T20:00:00Z" },
    ],
  },
  "margaret-rose-sullivan": {
    id: "demo-memorial-1",
    slug: "margaret-rose-sullivan",
    first_name: "Margaret",
    middle_name: "Rose",
    last_name: "Sullivan",
    nickname: "Maggie",
    birth_date: "1935-06-15",
    death_date: "2023-11-28",
    birth_place: "Boston, MA",
    resting_place: "Oak Hill Cemetery, Boston",
    obituary: "Margaret Rose Sullivan, beloved mother, grandmother, and friend, passed peacefully surrounded by family. Known for her warm smile and legendary apple pie, Maggie touched countless lives with her kindness and generosity. She was a devoted volunteer at the local library for over 30 years and never missed a Sunday dinner with family.",
    profile_photo_url: null,
    is_public: true,
    privacy_level: "public",
    view_count: 342,
    user_id: "demo-user-123",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    photos: [
      { id: "p1", url: "/demo/photos/family-gathering.jpg", caption: "Family Christmas 2022" },
      { id: "p2", url: "/demo/photos/garden.jpg", caption: "In her beloved garden" },
      { id: "p3", url: "/demo/photos/wedding.jpg", caption: "Wedding day, 1958" },
    ],
    stories: [
      { id: "s1", title: "The Apple Pie Legacy", content: "Every Thanksgiving, Mom would start baking at 5am...", author: "Sarah Sullivan" },
      { id: "s2", title: "Library Adventures", content: "When I was little, Grandma would take me to the library every Saturday...", author: "Emily Chen" },
    ],
    guestbook_entries: [
      { id: "g1", name: "John Thompson", message: "Maggie was the kindest neighbor anyone could ask for.", created_at: "2024-01-10T09:00:00Z" },
      { id: "g2", name: "Mary Williams", message: "Her smile could light up any room. Rest in peace, dear friend.", created_at: "2024-01-12T14:30:00Z" },
    ],
    candle_lightings: [
      { id: "c1", name: "Sarah Sullivan", message: "Missing you always, Mom", lit_at: "2024-01-20T18:00:00Z" },
      { id: "c2", name: "Michael Sullivan", message: "Love you, Grandma", lit_at: "2024-01-21T20:00:00Z" },
    ],
  },
  "demo-memorial-2": {
    id: "demo-memorial-2",
    slug: "robert-james-chen",
    first_name: "Robert",
    middle_name: "James",
    last_name: "Chen",
    nickname: "Bobby",
    birth_date: "1942-03-22",
    death_date: "2024-01-05",
    birth_place: "San Francisco, CA",
    resting_place: "Golden Gate Memorial Park",
    obituary: "Robert James Chen lived a life of adventure and purpose. A retired engineer who helped build bridges across California, Bobby was known for his infectious laughter and love of fishing. He spent his retirement teaching woodworking to local youth.",
    profile_photo_url: null,
    is_public: true,
    privacy_level: "public",
    view_count: 156,
    user_id: "demo-user-123",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-20T11:00:00Z",
    photos: [
      { id: "p4", url: "/demo/photos/fishing.jpg", caption: "Annual fishing trip" },
      { id: "p5", url: "/demo/photos/workshop.jpg", caption: "Teaching woodworking" },
    ],
    stories: [
      { id: "s3", title: "Building Bridges", content: "Dad always said he built bridges so families could stay connected...", author: "Lisa Chen" },
    ],
    guestbook_entries: [],
    candle_lightings: [
      { id: "c5", name: "Lisa Chen", message: "We miss you every day, Dad", lit_at: "2024-01-15T19:00:00Z" },
    ],
  },
  "robert-james-chen": {
    id: "demo-memorial-2",
    slug: "robert-james-chen",
    first_name: "Robert",
    middle_name: "James",
    last_name: "Chen",
    nickname: "Bobby",
    birth_date: "1942-03-22",
    death_date: "2024-01-05",
    birth_place: "San Francisco, CA",
    resting_place: "Golden Gate Memorial Park",
    obituary: "Robert James Chen lived a life of adventure and purpose. A retired engineer who helped build bridges across California, Bobby was known for his infectious laughter and love of fishing. He spent his retirement teaching woodworking to local youth.",
    profile_photo_url: null,
    is_public: true,
    privacy_level: "public",
    view_count: 156,
    user_id: "demo-user-123",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-20T11:00:00Z",
    photos: [
      { id: "p4", url: "/demo/photos/fishing.jpg", caption: "Annual fishing trip" },
      { id: "p5", url: "/demo/photos/workshop.jpg", caption: "Teaching woodworking" },
    ],
    stories: [
      { id: "s3", title: "Building Bridges", content: "Dad always said he built bridges so families could stay connected...", author: "Lisa Chen" },
    ],
    guestbook_entries: [],
    candle_lightings: [
      { id: "c5", name: "Lisa Chen", message: "We miss you every day, Dad", lit_at: "2024-01-15T19:00:00Z" },
    ],
  },
};

// GET /api/memorials/[id] - Get a single memorial
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // In demo mode, return mock memorial data
    if (DEMO_MODE) {
      const memorial = DEMO_MEMORIALS[id];
      if (!memorial) {
        return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
      }
      // Increment view count in demo mode (just for display)
      return NextResponse.json({ memorial: { ...memorial, view_count: memorial.view_count + 1 } });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user (optional for public memorials)
    const { data: { user } } = await supabase.auth.getUser();

    // Try to find by slug first, then by id
    let query = supabase
      .from('memorials')
      .select(`
        *,
        photos(*),
        stories(*),
        guestbook_entries(*),
        candle_lightings(*)
      `);

    // Check if id looks like a UUID or a slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: memorial, error } = await query.single();

    if (error || !memorial) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Type assertion for memorial data (Supabase types not generated)
    const memorialData = memorial as { id: string; user_id: string; is_public: boolean; [key: string]: unknown };

    // Check access permissions
    const isOwner = user && memorialData.user_id === user.id;
    const isPublic = memorialData.is_public;

    if (!isPublic && !isOwner) {
      // Check if user is a collaborator
      if (user) {
        const { data: collaborator } = await supabase
          .from('collaborators')
          .select('role')
          .eq('memorial_id', memorialData.id)
          .eq('user_id', user.id)
          .single();

        if (!collaborator) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // TODO: Increment view count (requires Supabase RPC function or generated types)
    // if (!isOwner) {
    //   const viewCount = (memorialData.view_count as number) || 0;
    //   await supabase.from('memorials').update({ view_count: viewCount + 1 }).eq('id', memorialData.id);
    // }

    return NextResponse.json({ memorial });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/memorials/[id] - Update a memorial
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // In demo mode, simulate update
    if (DEMO_MODE) {
      const memorial = DEMO_MEMORIALS[id];
      if (!memorial) {
        return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
      }

      const body = await request.json();

      // Simulate update by merging the body with existing memorial
      const updatedMemorial = {
        ...memorial,
        ...body,
        updated_at: new Date().toISOString(),
      };

      // Update the in-memory store (for current session)
      DEMO_MEMORIALS[id] = updatedMemorial;
      if (memorial.slug && memorial.slug !== id) {
        DEMO_MEMORIALS[memorial.slug] = updatedMemorial;
      }

      return NextResponse.json({ memorial: updatedMemorial });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has edit permissions
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const idColumn = isUuid ? 'id' : 'slug';

    const { data: memorialRow } = await supabase
      .from('memorials')
      .select('id, user_id')
      .eq(idColumn, id)
      .single();

    if (!memorialRow) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Type assertion for memorial data
    const memorialPut = memorialRow as { id: string; user_id: string };

    // Check if owner or editor
    const isOwner = memorialPut.user_id === user.id;

    if (!isOwner) {
      const { data: collabData } = await supabase
        .from('collaborators')
        .select('role')
        .eq('memorial_id', memorialPut.id)
        .eq('user_id', user.id)
        .single();

      const collaborator = collabData as { role: string } | null;
      if (!collaborator || collaborator.role === 'viewer') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const allowedFields = [
      'first_name',
      'middle_name',
      'last_name',
      'nickname',
      'birth_date',
      'death_date',
      'birth_place',
      'resting_place',
      'obituary',
      'profile_photo_url',
      'is_public',
      'privacy_level',
      'allow_guestbook',
      'allow_candle_lighting',
      'allow_contributions',
      'theme',
    ];

    // Only owner can change privacy settings
    const ownerOnlyFields = ['is_public', 'privacy_level'];
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

      if (allowedFields.includes(snakeKey)) {
        if (ownerOnlyFields.includes(snakeKey) && !isOwner) {
          continue; // Skip owner-only fields for non-owners
        }
        updateData[snakeKey] = value;
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Use raw SQL-like approach since Supabase types aren't generated
    const { data: updatedMemorial, error: updateError } = await supabase
      .from('memorials')
      .update(updateData as never)
      .eq('id', memorialPut.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating memorial:', updateError);
      return NextResponse.json({ error: 'Failed to update memorial' }, { status: 500 });
    }

    return NextResponse.json({ memorial: updatedMemorial });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/memorials/[id] - Delete a memorial
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // In demo mode, simulate delete
    if (DEMO_MODE) {
      const memorial = DEMO_MEMORIALS[id];
      if (!memorial) {
        return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
      }

      // Remove from in-memory store
      delete DEMO_MEMORIALS[id];
      if (memorial.slug && memorial.slug !== id) {
        delete DEMO_MEMORIALS[memorial.slug];
      }

      return NextResponse.json({ success: true, message: 'Memorial deleted (Demo Mode)' });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the owner
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const idColumn = isUuid ? 'id' : 'slug';

    const { data: memorialDel } = await supabase
      .from('memorials')
      .select('id, user_id')
      .eq(idColumn, id)
      .single();

    if (!memorialDel) {
      return NextResponse.json({ error: 'Memorial not found' }, { status: 404 });
    }

    // Type assertion for memorial data
    const memorialDelete = memorialDel as { id: string; user_id: string };

    if (memorialDelete.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can delete a memorial' }, { status: 403 });
    }

    // Delete the memorial (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('memorials')
      .delete()
      .eq('id', memorialDelete.id);

    if (deleteError) {
      console.error('Error deleting memorial:', deleteError);
      return NextResponse.json({ error: 'Failed to delete memorial' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
