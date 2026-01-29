/**
 * Audit Module
 *
 * Re-exports all audit logging and consent management utilities.
 */

// Types
export * from "./types";

// Logger utilities
export {
  logAuditEvent,
  getAuditTrail,
  exportAuditLog,
  logVoiceEvent,
  logAICompanionEvent,
  logMemorialEvent,
  logClaimEvent,
  logAuthEvent,
  getAuditStats,
  extractRequestInfo,
  anonymizeUserId,
} from "./logger";

// Consent utilities
export {
  getConsentText,
  getConsentVersion,
  giveConsent,
  revokeConsent,
  hasValidConsent,
  getConsentRecord,
  getUserConsents,
  getMemorialConsents,
  verifyFamilyAuthorization,
  getPendingVerifications,
  requireConsent,
  needsReConsent,
  getConsentSummary,
} from "./consent";
