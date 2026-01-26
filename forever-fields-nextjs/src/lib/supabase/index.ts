// Supabase client exports
export { createClient, getSupabaseClient } from './client';
export { createServerSupabaseClient, createServiceRoleClient } from './server';

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
