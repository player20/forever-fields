/**
 * OAuth State Token Management
 * Provides CSRF protection for OAuth flows by generating and validating state tokens
 */

import crypto from 'crypto';

interface StateData {
  createdAt: number;
  ip: string;
}

// In-memory store for state tokens
// TODO: Replace with Redis in production for scalability across multiple server instances
const stateStore = new Map<string, StateData>();

/**
 * Clean up expired state tokens every 5 minutes
 * State tokens expire after 10 minutes
 */
setInterval(() => {
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes

  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > expiryTime) {
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

/**
 * Generate a cryptographically secure OAuth state token
 * @param ip - Client IP address for additional validation
 * @returns Random 64-character hex string
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
 * @param state - State token from OAuth callback
 * @param ip - Client IP address
 * @returns true if valid and not expired, false otherwise
 */
export const validateOAuthState = (state: string, ip: string): boolean => {
  const data = stateStore.get(state);

  // State not found
  if (!data) {
    return false;
  }

  // IP mismatch (optional but recommended security measure)
  if (data.ip !== ip) {
    console.warn(`[SECURITY] OAuth state IP mismatch: expected ${data.ip}, got ${ip}`);
    // Still allow but log warning - some users may have changing IPs
  }

  // Check expiry (10 minutes)
  const expiryTime = 10 * 60 * 1000;
  if (Date.now() - data.createdAt > expiryTime) {
    stateStore.delete(state);
    return false;
  }

  // One-time use: delete after validation
  stateStore.delete(state);
  return true;
};

/**
 * Get current store size (for debugging/monitoring)
 */
export const getStateStoreSize = (): number => {
  return stateStore.size;
};
