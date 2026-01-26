import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// GET /api/memorials - List user's memorials
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's memorials (owned + collaborated)
    const { data: memorials, error } = await supabase
      .from('memorials')
      .select(`
        *,
        collaborators!inner(role, user_id)
      `)
      .or(`user_id.eq.${user.id},collaborators.user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memorials:', error);
      return NextResponse.json({ error: 'Failed to fetch memorials' }, { status: 500 });
    }

    return NextResponse.json({ memorials: memorials || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/memorials - Create a new memorial
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      nickname,
      birthDate,
      deathDate,
      birthPlace,
      restingPlace,
      obituary,
      profilePhotoUrl,
      isPublic,
      inviteEmails,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Generate a unique slug
    const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create the memorial
    const { data: memorial, error: createError } = await supabase
      .from('memorials')
      .insert({
        user_id: user.id,
        slug,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        nickname: nickname || null,
        birth_date: birthDate || null,
        death_date: deathDate || null,
        birth_place: birthPlace || null,
        resting_place: restingPlace || null,
        obituary: obituary || null,
        profile_photo_url: profilePhotoUrl || null,
        is_public: isPublic || false,
        privacy_level: isPublic ? 'public' : 'private',
      } as never)
      .select()
      .single();

    if (createError) {
      console.error('Error creating memorial:', createError);
      return NextResponse.json({ error: 'Failed to create memorial' }, { status: 500 });
    }

    // Type assertion for memorial data
    const memorialData = memorial as { id: string; slug: string };

    // Create owner collaborator record
    await supabase.from('collaborators').insert({
      memorial_id: memorialData.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    } as never);

    // Send invitations to family members (if any)
    if (inviteEmails && inviteEmails.length > 0) {
      const validEmails = inviteEmails.filter((email: string) => email && email.trim());

      for (const email of validEmails) {
        const inviteToken = nanoid(32);

        await supabase.from('collaborators').insert({
          memorial_id: memorialData.id,
          invited_email: email.trim(),
          role: 'editor',
          invite_token: inviteToken,
        } as never);

        // TODO: Send invitation email via SendGrid
        // For now, we just store the invitation
      }
    }

    return NextResponse.json({ memorial, slug: memorialData.slug }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
