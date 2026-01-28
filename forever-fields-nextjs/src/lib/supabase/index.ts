// Supabase client exports (client-side only)
export { createClient, getSupabaseClient } from './client';
// Note: Server exports (createServerSupabaseClient, createServiceRoleClient)
// must be imported directly from '@/lib/supabase/server' in API routes

// Auth utilities
export {
  signInWithMagicLink,
  signInWithPassword,
  signUp,
  signInWithGoogle,
  signInWithApple,
  signOut,
  getSession,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateUserProfile,
  verifyOtp,
  syncUserProfile,
  onAuthStateChange,
  type AuthResult,
} from './auth';

// Storage utilities
export {
  uploadMemorialPhoto,
  uploadProfilePhoto,
  deletePhoto,
  getSignedUrl,
} from './storage';

// Types
export * from './types';
