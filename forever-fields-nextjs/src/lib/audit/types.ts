/**
 * Audit Logging Types
 *
 * Type definitions for the audit logging and consent management system.
 * These types mirror the Prisma schema enums and models for use in application code.
 */

// Mirror of Prisma AuditEventType enum
export type AuditEventType =
  // Consent events
  | "VOICE_CONSENT_GIVEN"
  | "VOICE_CONSENT_REVOKED"
  | "AI_COMPANION_CONSENT_GIVEN"
  | "AI_COMPANION_CONSENT_REVOKED"
  | "EVENT_RECORDING_CONSENT_GIVEN"
  | "EVENT_RECORDING_CONSENT_REVOKED"
  // Voice events
  | "VOICE_SAMPLE_UPLOADED"
  | "VOICE_SAMPLE_DELETED"
  | "VOICE_MESSAGE_GENERATED"
  | "VOICE_MESSAGE_PLAYED"
  // AI Companion events
  | "AI_SESSION_STARTED"
  | "AI_SESSION_ENDED"
  | "AI_MESSAGE_SENT"
  | "AI_CRISIS_DETECTED"
  | "AI_BREAK_SUGGESTED"
  // Event hosting
  | "EVENT_CREATED"
  | "EVENT_STARTED"
  | "EVENT_RECORDING_STARTED"
  | "EVENT_ENDED"
  // Data access
  | "MEMORIAL_VIEWED"
  | "MEMORIAL_CREATED"
  | "MEMORIAL_UPDATED"
  | "MEMORIAL_DELETED"
  | "MEMORIAL_EXPORTED"
  | "DATA_DELETION_REQUESTED"
  | "DATA_EXPORTED"
  // Authentication
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_REGISTERED"
  // Claim system
  | "CLAIM_REQUEST_SUBMITTED"
  | "CLAIM_REQUEST_APPROVED"
  | "CLAIM_REQUEST_REJECTED";

// Mirror of Prisma ConsentType enum
export type ConsentType =
  | "VOICE_SELF"
  | "VOICE_FAMILY"
  | "AI_COMPANION"
  | "EVENT_RECORDING"
  | "LOCATION_TRACKING"
  | "DATA_PROCESSING";

// Audit log entry structure
export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId?: string | null;
  memorialId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

// Input for creating an audit log
export interface CreateAuditLogInput {
  eventType: AuditEventType;
  userId?: string;
  memorialId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Consent record structure
export interface ConsentRecord {
  id: string;
  userId: string;
  memorialId?: string | null;
  consentType: ConsentType;
  consentVersion: string;
  consentText: string;
  givenAt: Date;
  revokedAt?: Date | null;
  ipAddress?: string | null;
  authorizationType?: string | null;
  proofDocumentUrl?: string | null;
  relationshipToDeceased?: string | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  verificationNotes?: string | null;
}

// Input for creating a consent record
export interface CreateConsentInput {
  userId: string;
  memorialId?: string;
  consentType: ConsentType;
  consentVersion: string;
  consentText: string;
  ipAddress?: string;
  authorizationType?: AuthorizationType;
  proofDocumentUrl?: string;
  relationshipToDeceased?: string;
}

// Authorization types for family consent
export type AuthorizationType =
  | "legal_executor"
  | "next_of_kin"
  | "written_permission"
  | "power_of_attorney"
  | "self_recorded"
  | "pre_mortem_consent"
  | "family_authorized";

// Verification status for consent records
export type VerificationStatus = "pending" | "verified" | "rejected";

// Consent verification result
export interface ConsentVerificationResult {
  hasConsent: boolean;
  consentRecord?: ConsentRecord;
  isExpired?: boolean;
  isRevoked?: boolean;
  needsReConsent?: boolean;
  reason?: string;
}

// Audit trail export format
export type ExportFormat = "json" | "csv";

// Audit trail filter options
export interface AuditTrailFilter {
  userId?: string;
  memorialId?: string;
  eventTypes?: AuditEventType[];
  startDate?: Date;
  endDate?: Date;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

// Consent versions - increment when consent text changes
export const CONSENT_VERSIONS = {
  VOICE_SELF: "1.0",
  VOICE_FAMILY: "1.0",
  AI_COMPANION: "1.0",
  EVENT_RECORDING: "1.0",
  LOCATION_TRACKING: "1.0",
  DATA_PROCESSING: "1.0",
} as const;

// Consent text templates
export const CONSENT_TEXTS = {
  VOICE_SELF: `I confirm that I am recording my own voice for use in creating AI-generated voice messages. I understand that:
- My voice samples will be used to train an AI model to generate messages that sound like me
- The generated messages may not perfectly replicate my actual voice
- I can revoke this consent at any time, which will delete my voice samples
- Generated messages will be clearly marked as AI-generated`,

  VOICE_FAMILY: `I confirm that I have legal authority to authorize voice reproduction for the deceased individual named in this memorial. I understand that:
- Voice samples will be used to generate AI messages that approximate the deceased's voice
- This cannot perfectly replicate their actual voice and may contain inaccuracies
- I accept responsibility for appropriate use of generated audio within authorized circles
- I can revoke this authorization at any time
- All generated content will be clearly marked as AI-generated`,

  AI_COMPANION: `I acknowledge that I am interacting with an AI memorial companion. I understand that:
- This is an AI system designed to provide comfort, not a real connection to the deceased
- The AI cannot truly know or speak for the deceased person
- Grief support resources are available if I need professional help
- Conversation history may be stored to improve the experience
- I can stop the conversation at any time`,

  EVENT_RECORDING: `I consent to being recorded during this virtual memorial event. I understand that:
- The recording may include my video, audio, and any messages I share
- The recording will be shared with family members and others with memorial access
- I can join as an observer (no audio/video) if I prefer not to be recorded
- The memorial owner controls access to the recording`,

  LOCATION_TRACKING: `I consent to location tracking for the gravesite visit experience. I understand that:
- My location is used only to unlock special content near the memorial site
- Location is only tracked while this page is open
- Visit data may be stored to show recent visitors (anonymized option available)
- I can disable location tracking at any time`,

  DATA_PROCESSING: `I consent to the processing of my personal data as described in the Privacy Policy. I understand that:
- My data is used to provide and improve the memorial service
- I have the right to access, correct, and delete my data
- I can withdraw consent at any time
- Some data may be retained for legal compliance purposes`,
} as const;

// Rate limits for various features
export const RATE_LIMITS = {
  voice_generation: {
    free: { perDay: 3, perMonth: 10 },
    remember: { perDay: 10, perMonth: 50 },
    heritage: { perDay: 25, perMonth: 200 },
    legacy: { perDay: 100, perMonth: 1000 },
  },
  ai_companion: {
    free: { messagesPerDay: 20, sessionsPerDay: 3 },
    remember: { messagesPerDay: 100, sessionsPerDay: 10 },
    heritage: { messagesPerDay: 500, sessionsPerDay: 50 },
    legacy: { messagesPerDay: -1, sessionsPerDay: -1 }, // Unlimited
  },
} as const;
