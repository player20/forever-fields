import { getSupabaseClient } from './client';

const MEMORIAL_PHOTOS_BUCKET = 'memorial-photos';
const PROFILE_PHOTOS_BUCKET = 'profile-photos';

export async function uploadMemorialPhoto(
  memorialId: string,
  file: File,
  userId: string
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${memorialId}/${userId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(MEMORIAL_PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading photo:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(MEMORIAL_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading profile photo:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}

export async function deletePhoto(bucket: string, path: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error deleting photo:', error);
    return false;
  }

  return true;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}
