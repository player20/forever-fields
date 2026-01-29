import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  exchangeCodeForToken,
  getCurrentUser,
  isDemoMode,
} from "@/lib/familysearch";
import { cookies } from "next/headers";

// Demo mode
const DEMO_MODE = isDemoMode();

/**
 * GET /api/familysearch/callback - OAuth callback handler
 *
 * Handles the OAuth callback from FamilySearch.
 * Exchanges the authorization code for access tokens.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${baseUrl}/family-tree?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/family-tree?error=missing_params`
      );
    }

    // Get stored state and verifier from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get("fs_oauth_state")?.value;
    const codeVerifier = cookieStore.get("fs_code_verifier")?.value;

    // Validate state to prevent CSRF
    if (!DEMO_MODE && state !== storedState) {
      return NextResponse.redirect(
        `${baseUrl}/family-tree?error=invalid_state`
      );
    }

    // Clear the OAuth cookies
    cookieStore.delete("fs_oauth_state");
    cookieStore.delete("fs_code_verifier");

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code, codeVerifier || "");

    // Get the user's FamilySearch profile
    const fsUser = await getCurrentUser(tokens.access_token);

    // Store tokens
    // In demo mode, store in cookies
    // In production, store in database encrypted
    if (DEMO_MODE) {
      cookieStore.set("fs_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in || 3600,
        path: "/",
      });

      if (tokens.refresh_token) {
        cookieStore.set("fs_refresh_token", tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }

      // Store user info
      cookieStore.set(
        "fs_user",
        JSON.stringify({
          id: fsUser.id,
          displayName: fsUser.displayName,
          personId: fsUser.personId,
        }),
        {
          httpOnly: false, // Allow client access
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: tokens.expires_in || 3600,
          path: "/",
        }
      );
    } else {
      // Production: Store in database
      const { user } = await optionalAuth();

      if (user) {
        // TODO: Store connection in database
        // await prisma.familySearchConnection.upsert({
        //   where: { userId: user.id },
        //   create: {
        //     userId: user.id,
        //     accessToken: encrypt(tokens.access_token),
        //     refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        //     expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        //     fsPersonId: fsUser.personId,
        //   },
        //   update: {
        //     accessToken: encrypt(tokens.access_token),
        //     refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        //     expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        //     fsPersonId: fsUser.personId,
        //     lastSyncAt: new Date(),
        //   },
        // });
      }
    }

    // Redirect to family tree page with success
    return NextResponse.redirect(
      `${baseUrl}/family-tree?connected=true&name=${encodeURIComponent(fsUser.displayName)}`
    );
  } catch (error) {
    console.error("Error handling FamilySearch callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/family-tree?error=callback_failed`
    );
  }
}
