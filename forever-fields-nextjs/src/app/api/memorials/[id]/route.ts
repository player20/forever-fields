import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/memorials/[id] - Get a single memorial
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
