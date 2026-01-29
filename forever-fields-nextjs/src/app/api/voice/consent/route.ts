import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  initializeVoiceConsent,
  checkVoiceConsent,
  revokeVoiceConsent,
} from "@/lib/voice/consent";
import { extractRequestInfo } from "@/lib/audit";
import { FamilyAuthorizationData } from "@/lib/voice/types";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * POST /api/voice/consent - Initialize voice consent
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to initialize voice consent" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memorialId, ...authData } = body as {
      memorialId: string;
    } & FamilyAuthorizationData;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (!authData.authorizationType) {
      return NextResponse.json(
        { error: "Authorization type is required" },
        { status: 400 }
      );
    }

    const userId = user?.id || "demo-user";
    const requestInfo = extractRequestInfo(request);

    const result = await initializeVoiceConsent(
      userId,
      memorialId,
      authData,
      requestInfo
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profileId: result.profileId,
      message:
        authData.authorizationType === "self_recorded"
          ? "Voice consent initialized. You can now upload voice samples."
          : "Voice authorization submitted for review. You'll be notified once approved.",
    });
  } catch (error) {
    console.error("Error initializing voice consent:", error);
    return NextResponse.json(
      { error: "Failed to initialize voice consent" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/consent - Check voice consent status
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to check voice consent" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    const userId = user?.id || "demo-user";
    const result = await checkVoiceConsent(userId, memorialId);

    return NextResponse.json({
      hasConsent: result.hasConsent,
      needsVerification: result.needsVerification,
      reason: result.reason,
      profile: result.profile
        ? {
            id: result.profile.id,
            verificationStatus: result.profile.verificationStatus,
            totalDuration: result.profile.totalDuration,
            sampleCount: result.profile.samples.length,
            generationCount: result.profile.generationCount,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking voice consent:", error);
    return NextResponse.json(
      { error: "Failed to check voice consent" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/voice/consent - Revoke voice consent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to revoke voice consent" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memorialId, reason } = body;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    const userId = user?.id || "demo-user";
    const requestInfo = extractRequestInfo(request);

    const result = await revokeVoiceConsent(
      memorialId,
      userId,
      reason || "User requested revocation",
      requestInfo
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Voice consent has been revoked. All voice samples have been deleted.",
    });
  } catch (error) {
    console.error("Error revoking voice consent:", error);
    return NextResponse.json(
      { error: "Failed to revoke voice consent" },
      { status: 500 }
    );
  }
}
