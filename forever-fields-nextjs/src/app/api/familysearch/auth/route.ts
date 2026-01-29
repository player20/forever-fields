import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  getAuthorizationUrl,
  isDemoMode,
} from "@/lib/familysearch";
import { cookies } from "next/headers";

// Demo mode
const DEMO_MODE = isDemoMode();

/**
 * GET /api/familysearch/auth - Start OAuth flow
 *
 * Generates the authorization URL for FamilySearch OAuth.
 * Stores PKCE verifier and state in cookies for the callback.
 */
export async function GET(_request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to connect FamilySearch" },
        { status: 401 }
      );
    }

    // Generate PKCE parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Get the authorization URL
    const authUrl = getAuthorizationUrl(state, codeChallenge);

    // Store state and verifier in cookies for the callback
    const cookieStore = await cookies();

    // Set secure cookies with the PKCE parameters
    cookieStore.set("fs_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set("fs_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Return the authorization URL
    return NextResponse.json({
      authUrl,
      isDemoMode: DEMO_MODE,
    });
  } catch (error) {
    console.error("Error starting FamilySearch OAuth:", error);
    return NextResponse.json(
      { error: "Failed to start FamilySearch connection" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/familysearch/auth - Disconnect FamilySearch
 *
 * Removes the FamilySearch connection for the current user.
 */
export async function DELETE() {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to disconnect FamilySearch" },
        { status: 401 }
      );
    }

    // TODO: In production, delete the FamilySearchConnection record
    // await prisma.familySearchConnection.delete({
    //   where: { userId: user.id },
    // });

    // Clear any stored tokens (in cookies for demo)
    const cookieStore = await cookies();
    cookieStore.delete("fs_access_token");
    cookieStore.delete("fs_refresh_token");

    return NextResponse.json({
      success: true,
      message: "FamilySearch disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting FamilySearch:", error);
    return NextResponse.json(
      { error: "Failed to disconnect FamilySearch" },
      { status: 500 }
    );
  }
}
