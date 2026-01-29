import { NextRequest, NextResponse } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import {
  giveConsent,
  revokeConsent,
  hasValidConsent,
  getUserConsents,
  getConsentText,
  getConsentVersion,
  extractRequestInfo,
  ConsentType,
} from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

/**
 * POST /api/consent - Give consent for a feature
 *
 * Body:
 * - consentType: Required consent type
 * - memorialId: Optional memorial ID (required for some consent types)
 * - authorizationType: Optional for family authorization
 * - proofDocumentUrl: Optional for family authorization
 * - relationshipToDeceased: Optional for family authorization
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to give consent" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      consentType,
      memorialId,
      authorizationType,
      proofDocumentUrl,
      relationshipToDeceased,
    } = body;

    // Validate consent type
    const validConsentTypes: ConsentType[] = [
      "VOICE_SELF",
      "VOICE_FAMILY",
      "AI_COMPANION",
      "EVENT_RECORDING",
      "LOCATION_TRACKING",
      "DATA_PROCESSING",
    ];

    if (!consentType || !validConsentTypes.includes(consentType)) {
      return NextResponse.json(
        { error: "Invalid consent type" },
        { status: 400 }
      );
    }

    // For family authorization, require additional fields
    if (consentType === "VOICE_FAMILY") {
      if (!authorizationType) {
        return NextResponse.json(
          { error: "Authorization type is required for family voice consent" },
          { status: 400 }
        );
      }
      if (!relationshipToDeceased) {
        return NextResponse.json(
          { error: "Relationship to deceased is required" },
          { status: 400 }
        );
      }
      if (!memorialId) {
        return NextResponse.json(
          { error: "Memorial ID is required for family voice consent" },
          { status: 400 }
        );
      }
    }

    const userId = user?.id || "demo-user";
    const requestInfo = extractRequestInfo(request);

    const consentRecord = await giveConsent(
      {
        userId,
        memorialId,
        consentType,
        consentVersion: getConsentVersion(consentType),
        consentText: getConsentText(consentType),
        authorizationType,
        proofDocumentUrl,
        relationshipToDeceased,
      },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      message: "Consent recorded successfully",
      consentRecord: {
        id: consentRecord.id,
        consentType: consentRecord.consentType,
        consentVersion: consentRecord.consentVersion,
        givenAt: consentRecord.givenAt,
        needsVerification: consentType === "VOICE_FAMILY",
      },
    });
  } catch (error) {
    console.error("Error recording consent:", error);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consent - Check consent status or get user consents
 *
 * Query params:
 * - consentType: Optional specific consent type to check
 * - memorialId: Optional memorial ID
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to check consent" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const consentType = searchParams.get("consentType") as ConsentType | null;
    const memorialId = searchParams.get("memorialId");

    const userId = user?.id || "demo-user";

    // If specific consent type requested, check that
    if (consentType) {
      const result = await hasValidConsent(
        userId,
        consentType,
        memorialId || undefined
      );

      return NextResponse.json({
        consentType,
        hasConsent: result.hasConsent,
        needsReConsent: result.needsReConsent,
        isRevoked: result.isRevoked,
        reason: result.reason,
        consentRecord: result.consentRecord
          ? {
              id: result.consentRecord.id,
              consentVersion: result.consentRecord.consentVersion,
              givenAt: result.consentRecord.givenAt,
            }
          : null,
      });
    }

    // Otherwise, get all consents for user
    const consents = await getUserConsents(userId);

    return NextResponse.json({
      consents: consents.map((c) => ({
        id: c.id,
        consentType: c.consentType,
        memorialId: c.memorialId,
        consentVersion: c.consentVersion,
        givenAt: c.givenAt,
        revokedAt: c.revokedAt,
        verifiedAt: c.verifiedAt,
      })),
    });
  } catch (error) {
    console.error("Error checking consent:", error);
    return NextResponse.json(
      { error: "Failed to check consent" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/consent - Revoke consent
 *
 * Body:
 * - consentType: Required consent type
 * - memorialId: Optional memorial ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json(
        { error: "You must be logged in to revoke consent" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consentType, memorialId } = body;

    if (!consentType) {
      return NextResponse.json(
        { error: "Consent type is required" },
        { status: 400 }
      );
    }

    const userId = user?.id || "demo-user";
    const requestInfo = extractRequestInfo(request);

    const revokedRecord = await revokeConsent(
      userId,
      consentType,
      memorialId || undefined,
      requestInfo
    );

    return NextResponse.json({
      success: true,
      message: "Consent revoked successfully",
      revokedAt: revokedRecord?.revokedAt || new Date(),
    });
  } catch (error) {
    console.error("Error revoking consent:", error);
    return NextResponse.json(
      { error: "Failed to revoke consent" },
      { status: 500 }
    );
  }
}
