import { getSupabaseClient } from './client';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import type { User } from './types';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: SupabaseUser | null;
  session?: Session | null;
}

/**
 * Sign in with magic link (passwordless email)
 * Ideal for grieving families - no password friction
 */
export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user, session: data.session };
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { firstName?: string; lastName?: string }
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        first_name: metadata?.firstName,
        last_name: metadata?.lastName,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user, session: data.session };
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sign in with Apple OAuth
 */
export async function signInWithApple(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();

  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const supabase = getSupabaseClient();

  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Request password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update password after reset
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: updates.firstName,
      last_name: updates.lastName,
      avatar_url: updates.avatarUrl,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Verify the OTP from magic link email
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user, session: data.session };
}

/**
 * Get or create user profile in the users table
 * Called after successful authentication to sync Supabase auth with our users table
 */
export async function syncUserProfile(authUser: SupabaseUser): Promise<User | null> {
  const supabase = getSupabaseClient();

  // Check if user profile exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (existingUser) {
    return existingUser as User;
  }

  // Create new user profile if it doesn't exist
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email!,
      first_name: authUser.user_metadata?.first_name || null,
      last_name: authUser.user_metadata?.last_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    } as never)
    .select()
    .single();

  if (createError) {
    console.error('Error creating user profile:', createError);
    return null;
  }

  return newUser as User;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = getSupabaseClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return subscription;
}
