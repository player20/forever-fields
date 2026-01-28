import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// Demo mode for local development without real Supabase credentials
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo memorials for auditing/demo purposes
const DEMO_MEMORIALS = [
  {
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
    profile_photo_url: null,
    view_count: 342,
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-01-15T14:30:00Z",
    photos: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
    stories: [{ id: "s1" }, { id: "s2" }],
    candle_lightings: [{ id: "c1" }, { id: "c2" }, { id: "c3" }, { id: "c4" }],
    collaborators: [{ role: "owner", user_id: "demo-user-123" }],
  },
  {
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
    profile_photo_url: null,
    view_count: 156,
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-20T11:00:00Z",
    photos: [{ id: "p4" }, { id: "p5" }],
    stories: [{ id: "s3" }],
    candle_lightings: [{ id: "c5" }, { id: "c6" }],
    collaborators: [{ role: "owner", user_id: "demo-user-123" }],
  },
  {
    id: "demo-memorial-3",
    slug: "eleanor-grace-williams",
    first_name: "Eleanor",
    middle_name: "Grace",
    last_name: "Williams",
    nickname: null,
    birth_date: "1948-09-10",
    death_date: "2023-08-15",
    birth_place: "Chicago, IL",
    resting_place: "Rosehill Cemetery, Chicago",
    profile_photo_url: null,
    view_count: 89,
    created_at: "2023-08-20T15:00:00Z",
    updated_at: "2023-12-01T09:00:00Z",
    photos: [{ id: "p6" }],
    stories: [],
    candle_lightings: [{ id: "c7" }],
    collaborators: [{ role: "editor", user_id: "demo-user-123" }],
  },
];

// GET /api/memorials - List user's memorials
export async function GET(request: NextRequest) {
  try {
    // In demo mode, return mock memorials
    if (DEMO_MODE) {
      return NextResponse.json({ memorials: DEMO_MEMORIALS });
    }

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
    const body = await request.json();

    // In demo mode, return a mock created memorial
    if (DEMO_MODE) {
      const { firstName, lastName } = body;
      const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${nanoid(6)}`;

      const mockMemorial = {
        id: `demo-memorial-${nanoid(8)}`,
        slug,
        first_name: firstName,
        last_name: lastName,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({ memorial: mockMemorial, slug }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
