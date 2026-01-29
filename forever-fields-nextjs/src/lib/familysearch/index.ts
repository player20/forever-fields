/**
 * FamilySearch Module
 *
 * Re-exports all FamilySearch API utilities.
 */

// Types
export * from "./types";

// Auth utilities
export {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getCurrentUser,
  revokeToken,
  isTokenExpired,
  getApiBaseUrl,
  isDemoMode,
} from "./auth";

// API client
export { FamilySearchClient, createFamilySearchClient } from "./client";
