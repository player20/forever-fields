/**
 * FamilySearch OAuth Authentication
 *
 * Handles OAuth 2.0 flow for connecting to FamilySearch API.
 * Uses Authorization Code grant with PKCE for security.
 *
 * Environment variables required:
 * - FAMILYSEARCH_CLIENT_ID: Your FamilySearch app ID
 * - FAMILYSEARCH_REDIRECT_URI: OAuth callback URL
 * - NEXT_PUBLIC_APP_URL: Base URL of your app
 *
 * Note: FamilySearch API uses sandbox for development and production for live data.
 */

import { FamilySearchTokenResponse, FamilySearchUser } from "./types";

// FamilySearch API endpoints
const SANDBOX_BASE_URL = "https://sandbox.familysearch.org";
const PRODUCTION_BASE_URL = "https://www.familysearch.org";

// Use sandbox for development, production for live
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;

const OAUTH_AUTHORIZE_URL = `${BASE_URL}/cis-web/oauth2/v3/authorization`;
const OAUTH_TOKEN_URL = `${BASE_URL}/cis-web/oauth2/v3/token`;
const API_BASE_URL = IS_PRODUCTION
  ? "https://api.familysearch.org"
  : "https://api.familysearch.org/sandbox";

// Demo mode - when true, use mock data
const DEMO_MODE = !process.env.FAMILYSEARCH_CLIENT_ID;

/**
 * Generate a random state value for OAuth security
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Get the OAuth authorization URL
 */
export function getAuthorizationUrl(
  state: string,
  codeChallenge: string
): string {
  if (DEMO_MODE) {
    // Return a demo callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/familysearch/callback?code=demo&state=${state}`;
  }

  const clientId = process.env.FAMILYSEARCH_CLIENT_ID;
  const redirectUri =
    process.env.FAMILYSEARCH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/familysearch/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: redirectUri,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: "openid profile email FamilyTree.Read",
  });

  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<FamilySearchTokenResponse> {
  if (DEMO_MODE) {
    // Return mock token for demo mode
    return {
      access_token: "demo-access-token",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "demo-refresh-token",
    };
  }

  const clientId = process.env.FAMILYSEARCH_CLIENT_ID;
  const redirectUri =
    process.env.FAMILYSEARCH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/familysearch/callback`;

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    client_id: clientId!,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<FamilySearchTokenResponse> {
  if (DEMO_MODE) {
    return {
      access_token: "demo-access-token-refreshed",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "demo-refresh-token",
    };
  }

  const clientId = process.env.FAMILYSEARCH_CLIENT_ID;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId!,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get the current user's FamilySearch profile
 */
export async function getCurrentUser(
  accessToken: string
): Promise<FamilySearchUser> {
  if (DEMO_MODE) {
    return {
      id: "demo-user-fs",
      displayName: "Demo User",
      email: "demo@example.com",
      personId: "DEMO-PERSON-ID",
    };
  }

  const response = await fetch(`${API_BASE_URL}/platform/users/current`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get current user: ${error}`);
  }

  const data = await response.json();
  const user = data.users?.[0];

  return {
    id: user?.id || "",
    displayName: user?.displayName || user?.contactName || "Unknown",
    email: user?.email,
    personId: user?.personId,
  };
}

/**
 * Revoke a FamilySearch access token
 */
export async function revokeToken(_accessToken: string): Promise<void> {
  if (DEMO_MODE) {
    return;
  }

  // FamilySearch doesn't have a dedicated revocation endpoint
  // The token will expire naturally
  // For security, we just clear it from our storage
  console.log("FamilySearch token revoked (cleared from storage)");
}

/**
 * Check if a token is expired or about to expire
 */
export function isTokenExpired(expiresAt: Date, bufferMinutes = 5): boolean {
  const now = new Date();
  const buffer = bufferMinutes * 60 * 1000; // Convert to milliseconds
  return expiresAt.getTime() - buffer <= now.getTime();
}

/**
 * Get API base URL for making requests
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Check if we're in demo mode
 */
export function isDemoMode(): boolean {
  return DEMO_MODE;
}
