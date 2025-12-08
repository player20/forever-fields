/**
 * OAuth State Management
 * Prevents CSRF attacks on OAuth flows using the state parameter
 */

import crypto from 'crypto';

// In-memory store for OAuth state tokens
// In production, use Redis or database for distributed systems
const stateStore = new Map<string, { createdAt: number; ip: string }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const staleEntries: string[] = [];

  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      // 10 minutes
      staleEntries.push(state);
    }
  }

  staleEntries.forEach((state) => stateStore.delete(state));

  if (staleEntries.length > 0) {
    console.log(`[OAUTH] Cleaned up ${staleEntries.length} expired state tokens`);
  }
}, 5 * 60 * 1000);

/**
 * Generate a new OAuth state token
 */
export const generateOAuthState = (ip: string): string => {
  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, {
    createdAt: Date.now(),
    ip,
  });
  return state;
};

/**
 * Validate an OAuth state token
 * Returns true if valid and not expired, false otherwise
 */
export const validateOAuthState = (state: string, ip: string): boolean => {
  const data = stateStore.get(state);

  if (!data) {
    console.warn('[OAUTH] Invalid state token (not found)');
    return false;
  }

  // Optional: Validate IP matches (helps prevent some attacks)
  if (data.ip !== ip) {
    console.warn(`[OAUTH] State IP mismatch: ${ip} vs ${data.ip}`);
    // Don't fail on IP mismatch (user might be behind NAT/proxy)
    // Just log it for monitoring
  }

  // Check expiry (10 minutes)
  if (Date.now() - data.createdAt > 10 * 60 * 1000) {
    stateStore.delete(state);
    console.warn('[OAUTH] Expired state token');
    return false;
  }

  // One-time use - delete after validation
  stateStore.delete(state);
  return true;
};
