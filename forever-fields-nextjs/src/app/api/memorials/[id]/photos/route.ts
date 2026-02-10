// Photo API for memorials
// Upload, list, and manage photos

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo photos store
const demoPhotos: Map<string, Array<{
  id: string;
  memorialId: string;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  estimatedDecade: string | null;
  isProfilePhoto: boolean;
  sortOrder: number;
  createdAt: string;
}>> = new Map();

// GET /api/memorials/[id]/photos - List photos for a memorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;

  if (DEMO_MODE) {
    const photos = demoPhotos.get(memorialId) || [];
    return NextResponse.json({ photos });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: photos, error } = await supabase
      .from("photos")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching photos:", error);
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }

    return NextResponse.json({ photos: photos || [] });
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/memorials/[id]/photos - Upload a photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;
    const estimatedDecade = formData.get("estimatedDecade") as string | null;
    const isProfilePhoto = formData.get("isProfilePhoto") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      // Create mock photo for demo mode
      const photoId = `photo-${Date.now()}`;
      const mockUrl = `https://picsum.photos/seed/${photoId}/800/600`;
      const mockThumb = `https://picsum.photos/seed/${photoId}/200/150`;

      const existingPhotos = demoPhotos.get(memorialId) || [];
      const newPhoto = {
        id: photoId,
        memorialId,
        url: mockUrl,
        thumbnailUrl: mockThumb,
        caption,
        estimatedDecade,
        isProfilePhoto,
        sortOrder: existingPhotos.length,
        createdAt: new Date().toISOString(),
      };

      demoPhotos.set(memorialId, [...existingPhotos, newPhoto]);

      return NextResponse.json({ photo: newPhoto }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const filename = `${memorialId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("memorial-photos")
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("memorial-photos")
      .getPublicUrl(uploadData.path);

    // Get current photo count for sort order
    const { count } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("memorial_id", memorialId);

    // Create photo record
    const { data: photo, error: dbError } = await supabase
      .from("photos")
      .insert({
        memorial_id: memorialId,
        uploaded_by: user.id,
        url: urlData.publicUrl,
        thumbnail_url: urlData.publicUrl, // TODO: Generate actual thumbnail
        caption,
        estimated_decade: estimatedDecade,
        is_profile_photo: isProfilePhoto,
        sort_order: count || 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded file
      await supabase.storage.from("memorial-photos").remove([uploadData.path]);
      return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
    }

    // If this is a profile photo, update the memorial
    if (isProfilePhoto) {
      await supabase
        .from("memorials")
        .update({ profile_photo_url: urlData.publicUrl })
        .eq("id", memorialId);
    }

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/memorials/[id]/photos - Delete multiple photos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: memorialId } = await params;
  const { photoIds } = await request.json();

  if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "photoIds array required" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const existingPhotos = demoPhotos.get(memorialId) || [];
    const filtered = existingPhotos.filter((p) => !photoIds.includes(p.id));
    demoPhotos.set(memorialId, filtered);
    return NextResponse.json({ deleted: photoIds.length });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get photo URLs to delete from storage
    const { data: photos } = await supabase
      .from("photos")
      .select("id, url")
      .eq("memorial_id", memorialId)
      .in("id", photoIds);

    if (photos && photos.length > 0) {
      // Extract storage paths from URLs
      const paths = photos
        .map((p) => {
          const match = p.url.match(/memorial-photos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      // Delete from storage
      if (paths.length > 0) {
        await supabase.storage.from("memorial-photos").remove(paths);
      }

      // Delete from database
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("memorial_id", memorialId)
        .in("id", photoIds);

      if (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete photos" }, { status: 500 });
      }
    }

    return NextResponse.json({ deleted: photos?.length || 0 });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
