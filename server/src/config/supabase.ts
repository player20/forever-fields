/**
 * Supabase Client Configuration
 * For auth and storage operations
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Public client (for client-side operations if needed)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
