/**
 * Consent Management
 *
 * Utilities for managing user consent records for various features.
 * Handles consent creation, verification, and revocation with full audit trail.
 */

import { logAuditEvent, extractRequestInfo as _extractRequestInfo } from "./logger";
import {
  ConsentType,
  ConsentRecord,
  CreateConsentInput,
  ConsentVerificationResult,
  CONSENT_VERSIONS,
  CONSENT_TEXTS,
  AuditEventType,
} from "./types";

// Demo mode - when true, use in-memory storage instead of database
const DEMO_MODE = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoConsentRecords: ConsentRecord[] = [];

/**
 * Get the current consent text for a consent type
 */
export function getConsentText(consentType: ConsentType): string {
  return CONSENT_TEXTS[consentType];
}

/**
 * Get the current consent version for a consent type
 */
export function getConsentVersion(consentType: ConsentType): string {
  return CONSENT_VERSIONS[consentType];
}

/**
 * Create a new consent record
 *
 * Records that a user has given consent for a specific feature.
 * Logs an audit event and stores the consent record.
 */
export async function giveConsent(
  input: CreateConsentInput,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<ConsentRecord> {
  const record: ConsentRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    memorialId: input.memorialId || null,
    consentType: input.consentType,
    consentVersion: input.consentVersion,
    consentText: input.consentText,
    givenAt: new Date(),
    revokedAt: null,
    ipAddress: requestInfo?.ipAddress || input.ipAddress || null,
    authorizationType: input.authorizationType || null,
    proofDocumentUrl: input.proofDocumentUrl || null,
    relationshipToDeceased: input.relationshipToDeceased || null,
    verifiedAt: null,
    verifiedBy: null,
    verificationNotes: null,
  };

  if (DEMO_MODE) {
    // Check for existing consent and update if found
    const existingIndex = demoConsentRecords.findIndex(
      (r) =>
        r.userId === input.userId &&
        r.memorialId === input.memorialId &&
        r.consentType === input.consentType
    );

    if (existingIndex >= 0) {
      demoConsentRecords[existingIndex] = record;
    } else {
      demoConsentRecords.push(record);
    }
  }

  // Log audit event
  const auditEventType = getConsentAuditEventType(input.consentType, "given");
  await logAuditEvent({
    eventType: auditEventType,
    userId: input.userId,
    memorialId: input.memorialId,
    metadata: {
      consentType: input.consentType,
      consentVersion: input.consentVersion,
      authorizationType: input.authorizationType,
    },
    ipAddress: requestInfo?.ipAddress,
    userAgent: requestInfo?.userAgent,
  });

  // Production: Store in database via Prisma
  // TODO: Implement Prisma integration
  // const record = await prisma.consentRecord.upsert({
  //   where: {
  //     userId_memorialId_consentType: {
  //       userId: input.userId,
  //       memorialId: input.memorialId || '',
  //       consentType: input.consentType,
  //     },
  //   },
  //   create: { ...input },
  //   update: { ...input, revokedAt: null },
  // });

  console.log(`[CONSENT] Given: ${input.consentType}`, {
    userId: input.userId,
    memorialId: input.memorialId,
  });

  return record;
}

/**
 * Revoke a consent record
 *
 * Marks a consent as revoked. Does NOT delete the record (for audit trail).
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentType,
  memorialId?: string,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<ConsentRecord | null> {
  if (DEMO_MODE) {
    const record = demoConsentRecords.find(
      (r) =>
        r.userId === userId &&
        r.consentType === consentType &&
        (memorialId ? r.memorialId === memorialId : true) &&
        !r.revokedAt
    );

    if (record) {
      record.revokedAt = new Date();
    }

    // Log audit event
    const auditEventType = getConsentAuditEventType(consentType, "revoked");
    await logAuditEvent({
      eventType: auditEventType,
      userId,
      memorialId,
      metadata: { consentType },
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    console.log(`[CONSENT] Revoked: ${consentType}`, {
      userId,
      memorialId,
    });

    return record || null;
  }

  // Production: Update in database via Prisma
  // TODO: Implement Prisma integration
  // const record = await prisma.consentRecord.update({
  //   where: {
  //     userId_memorialId_consentType: {
  //       userId,
  //       memorialId: memorialId || '',
  //       consentType,
  //     },
  //   },
  //   data: { revokedAt: new Date() },
  // });

  return null;
}

/**
 * Check if a user has valid consent for a feature
 *
 * Validates that:
 * 1. Consent exists
 * 2. Consent has not been revoked
 * 3. Consent version is current (may need re-consent)
 * 4. For family authorization, consent is verified
 */
export async function hasValidConsent(
  userId: string,
  consentType: ConsentType,
  memorialId?: string
): Promise<ConsentVerificationResult> {
  const currentVersion = getConsentVersion(consentType);

  if (DEMO_MODE) {
    const record = demoConsentRecords.find(
      (r) =>
        r.userId === userId &&
        r.consentType === consentType &&
        (memorialId ? r.memorialId === memorialId : true)
    );

    if (!record) {
      return {
        hasConsent: false,
        reason: "No consent record found",
      };
    }

    if (record.revokedAt) {
      return {
        hasConsent: false,
        consentRecord: record,
        isRevoked: true,
        reason: "Consent has been revoked",
      };
    }

    // Check if consent version is current
    if (record.consentVersion !== currentVersion) {
      return {
        hasConsent: false,
        consentRecord: record,
        needsReConsent: true,
        reason: `Consent version ${record.consentVersion} is outdated. Current version is ${currentVersion}`,
      };
    }

    // For family authorization, check verification status
    if (
      consentType === "VOICE_FAMILY" &&
      record.authorizationType &&
      !record.verifiedAt
    ) {
      return {
        hasConsent: false,
        consentRecord: record,
        reason: "Family authorization pending verification",
      };
    }

    return {
      hasConsent: true,
      consentRecord: record,
    };
  }

  // Production: Query database via Prisma
  // TODO: Implement Prisma integration
  // const record = await prisma.consentRecord.findUnique({
  //   where: {
  //     userId_memorialId_consentType: {
  //       userId,
  //       memorialId: memorialId || '',
  //       consentType,
  //     },
  //   },
  // });

  return {
    hasConsent: false,
    reason: "Database not available",
  };
}

/**
 * Get a consent record
 */
export async function getConsentRecord(
  userId: string,
  consentType: ConsentType,
  memorialId?: string
): Promise<ConsentRecord | null> {
  if (DEMO_MODE) {
    return (
      demoConsentRecords.find(
        (r) =>
          r.userId === userId &&
          r.consentType === consentType &&
          (memorialId ? r.memorialId === memorialId : true)
      ) || null
    );
  }

  // Production: Query database via Prisma
  return null;
}

/**
 * Get all consent records for a user
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  if (DEMO_MODE) {
    return demoConsentRecords.filter((r) => r.userId === userId);
  }

  // Production: Query database via Prisma
  return [];
}

/**
 * Get all consent records for a memorial
 */
export async function getMemorialConsents(
  memorialId: string
): Promise<ConsentRecord[]> {
  if (DEMO_MODE) {
    return demoConsentRecords.filter((r) => r.memorialId === memorialId);
  }

  // Production: Query database via Prisma
  return [];
}

/**
 * Verify a family authorization consent
 *
 * Called by admin after reviewing proof documents.
 */
export async function verifyFamilyAuthorization(
  consentId: string,
  verifiedBy: string,
  approved: boolean,
  notes?: string
): Promise<ConsentRecord | null> {
  if (DEMO_MODE) {
    const record = demoConsentRecords.find((r) => r.id === consentId);

    if (record) {
      if (approved) {
        record.verifiedAt = new Date();
        record.verifiedBy = verifiedBy;
        record.verificationNotes = notes || null;
      } else {
        // Rejection - revoke the consent
        record.revokedAt = new Date();
        record.verificationNotes = notes || "Authorization rejected";
      }
    }

    return record || null;
  }

  // Production: Update in database via Prisma
  return null;
}

/**
 * Get pending family authorization verifications
 *
 * Returns consent records that need admin review.
 */
export async function getPendingVerifications(): Promise<ConsentRecord[]> {
  if (DEMO_MODE) {
    return demoConsentRecords.filter(
      (r) =>
        r.consentType === "VOICE_FAMILY" &&
        r.authorizationType &&
        !r.verifiedAt &&
        !r.revokedAt
    );
  }

  // Production: Query database via Prisma
  return [];
}

/**
 * Helper to require consent before performing an action
 *
 * Throws an error if consent is not valid. Use in API routes.
 */
export async function requireConsent(
  userId: string,
  consentType: ConsentType,
  memorialId?: string
): Promise<ConsentRecord> {
  const result = await hasValidConsent(userId, consentType, memorialId);

  if (!result.hasConsent) {
    const error = new Error(result.reason || "Consent required");
    (error as Error & { code: string }).code = "CONSENT_REQUIRED";
    (error as Error & { consentType: string }).consentType = consentType;
    (error as Error & { needsReConsent?: boolean }).needsReConsent =
      result.needsReConsent;
    throw error;
  }

  return result.consentRecord!;
}

/**
 * Map consent type to audit event type
 */
function getConsentAuditEventType(
  consentType: ConsentType,
  action: "given" | "revoked"
): AuditEventType {
  const mapping: Record<ConsentType, { given: AuditEventType; revoked: AuditEventType }> = {
    VOICE_SELF: {
      given: "VOICE_CONSENT_GIVEN",
      revoked: "VOICE_CONSENT_REVOKED",
    },
    VOICE_FAMILY: {
      given: "VOICE_CONSENT_GIVEN",
      revoked: "VOICE_CONSENT_REVOKED",
    },
    AI_COMPANION: {
      given: "AI_COMPANION_CONSENT_GIVEN",
      revoked: "AI_COMPANION_CONSENT_REVOKED",
    },
    EVENT_RECORDING: {
      given: "EVENT_RECORDING_CONSENT_GIVEN",
      revoked: "EVENT_RECORDING_CONSENT_REVOKED",
    },
    LOCATION_TRACKING: {
      given: "VOICE_CONSENT_GIVEN", // Reuse for now
      revoked: "VOICE_CONSENT_REVOKED",
    },
    DATA_PROCESSING: {
      given: "VOICE_CONSENT_GIVEN", // Reuse for now
      revoked: "VOICE_CONSENT_REVOKED",
    },
  };

  return mapping[consentType][action];
}

/**
 * Check if consent version needs update
 */
export function needsReConsent(
  record: ConsentRecord,
  consentType: ConsentType
): boolean {
  const currentVersion = getConsentVersion(consentType);
  return record.consentVersion !== currentVersion;
}

/**
 * Get consent summary for a user
 */
export async function getConsentSummary(userId: string): Promise<{
  consents: Array<{
    type: ConsentType;
    hasConsent: boolean;
    givenAt?: Date;
    needsReConsent?: boolean;
  }>;
}> {
  const allTypes: ConsentType[] = [
    "VOICE_SELF",
    "VOICE_FAMILY",
    "AI_COMPANION",
    "EVENT_RECORDING",
    "LOCATION_TRACKING",
    "DATA_PROCESSING",
  ];

  const consents = await Promise.all(
    allTypes.map(async (type) => {
      const result = await hasValidConsent(userId, type);
      return {
        type,
        hasConsent: result.hasConsent,
        givenAt: result.consentRecord?.givenAt,
        needsReConsent: result.needsReConsent,
      };
    })
  );

  return { consents };
}
