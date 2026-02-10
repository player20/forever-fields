import { NextRequest } from "next/server";
import { optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  handleApiError,
} from "@/lib/api";
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

const VALID_CONSENT_TYPES: ConsentType[] = [
  "VOICE_SELF",
  "VOICE_FAMILY",
  "AI_COMPANION",
  "EVENT_RECORDING",
  "LOCATION_TRACKING",
  "DATA_PROCESSING",
];

/**
 * POST /api/consent - Give consent for a feature
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return apiUnauthorized("You must be logged in to give consent");
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
    if (!consentType || !VALID_CONSENT_TYPES.includes(consentType)) {
      return apiBadRequest("Invalid consent type");
    }

    // For family authorization, require additional fields
    if (consentType === "VOICE_FAMILY") {
      if (!authorizationType) {
        return apiBadRequest(
          "Authorization type is required for family voice consent"
        );
      }
      if (!relationshipToDeceased) {
        return apiBadRequest("Relationship to deceased is required");
      }
      if (!memorialId) {
        return apiBadRequest(
          "Memorial ID is required for family voice consent"
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

    return apiSuccess({
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
    return handleApiError(error);
  }
}

/**
 * GET /api/consent - Check consent status or get user consents
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return apiUnauthorized("You must be logged in to check consent");
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

      return apiSuccess({
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

    return apiSuccess({
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
    return handleApiError(error);
  }
}

/**
 * DELETE /api/consent - Revoke consent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return apiUnauthorized("You must be logged in to revoke consent");
    }

    const body = await request.json();
    const { consentType, memorialId } = body;

    if (!consentType) {
      return apiBadRequest("Consent type is required");
    }

    const userId = user?.id || "demo-user";
    const requestInfo = extractRequestInfo(request);

    const revokedRecord = await revokeConsent(
      userId,
      consentType,
      memorialId || undefined,
      requestInfo
    );

    return apiSuccess({
      message: "Consent revoked successfully",
      revokedAt: revokedRecord?.revokedAt || new Date(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
