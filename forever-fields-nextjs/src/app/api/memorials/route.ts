import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { DEMO_MODE } from "@/lib/constants";
import {
  apiSuccess,
  apiCreated,
  apiUnauthorized,
  apiBadRequest,
  handleApiError,
} from "@/lib/api";
import { getAllMemorials, createMemorial as createDemoMemorial } from "@/lib/demo-store";

// GET /api/memorials - List user's memorials
export async function GET(_request: NextRequest) {
  try {
    // In demo mode, return memorials from persistent store
    if (DEMO_MODE) {
      const memorials = getAllMemorials().map((m) => ({
        ...m,
        collaborators: [{ role: "owner", user_id: m.user_id }],
      }));
      return apiSuccess({ memorials });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Get user's memorials (owned + collaborated)
    const { data: memorials, error } = await supabase
      .from("memorials")
      .select(
        `
        *,
        collaborators!inner(role, user_id)
      `
      )
      .or(`user_id.eq.${user.id},collaborators.user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching memorials:", error);
      return handleApiError(error, { context: "fetch_memorials" });
    }

    return apiSuccess({ memorials: memorials || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/memorials - Create a new memorial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In demo mode, create and persist memorial to JSON file
    if (DEMO_MODE) {
      const { firstName, lastName, middleName, nickname, birthDate, deathDate, birthPlace, restingPlace, obituary, profilePhotoUrl, isPublic, theme } = body;
      const baseSlug = `${firstName}-${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const slug = `${baseSlug}-${nanoid(6)}`;

      const memorial = createDemoMemorial({
        id: `demo-memorial-${nanoid(8)}`,
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
        cover_photo_url: null,
        is_public: isPublic ?? false,
        privacy_level: isPublic ? "public" : "private",
        view_count: 0,
        user_id: "demo-user-123",
        theme: theme || "garden",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return apiCreated({ memorial, slug });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
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
      return apiBadRequest("First name and last name are required");
    }

    // Generate a unique slug
    const baseSlug = `${firstName}-${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create the memorial
    const { data: memorial, error: createError } = await supabase
      .from("memorials")
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
        privacy_level: isPublic ? "public" : "private",
      } as never)
      .select()
      .single();

    if (createError) {
      console.error("Error creating memorial:", createError);
      return handleApiError(createError, { context: "create_memorial" });
    }

    // Type assertion for memorial data
    const memorialData = memorial as { id: string; slug: string };

    // Create owner collaborator record
    await supabase.from("collaborators").insert({
      memorial_id: memorialData.id,
      user_id: user.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    } as never);

    // Send invitations to family members (if any)
    if (inviteEmails && inviteEmails.length > 0) {
      const validEmails = inviteEmails.filter(
        (email: string) => email && email.trim()
      );

      for (const email of validEmails) {
        const inviteToken = nanoid(32);

        await supabase.from("collaborators").insert({
          memorial_id: memorialData.id,
          invited_email: email.trim(),
          role: "editor",
          invite_token: inviteToken,
        } as never);
      }
    }

    return apiCreated({ memorial, slug: memorialData.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
