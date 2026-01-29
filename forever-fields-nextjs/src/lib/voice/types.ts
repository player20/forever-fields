/**
 * Voice Cloning Types
 *
 * Type definitions for the voice cloning system with consent workflow.
 */

// Authorization types for voice consent
export type VoiceAuthorizationType =
  | "self_recorded"
  | "family_authorized"
  | "pre_mortem_consent";

// Proof document types
export type ProofDocumentType =
  | "death_certificate"
  | "will"
  | "power_of_attorney"
  | "written_permission"
  | "funeral_home_letter"
  | "other";

// Verification status
export type VoiceVerificationStatus = "pending" | "verified" | "rejected";

// Relationship types for family authorization
export type FamilyRelationship =
  | "spouse"
  | "child"
  | "parent"
  | "sibling"
  | "grandchild"
  | "grandparent"
  | "legal_guardian"
  | "executor"
  | "power_of_attorney"
  | "other";

// Voice sample metadata
export interface VoiceSample {
  id: string;
  url: string;
  duration: number; // seconds
  uploadedAt: Date;
  quality?: "low" | "medium" | "high";
}

// Voice profile structure
export interface VoiceProfile {
  id: string;
  memorialId: string;
  createdByUserId: string;
  samples: VoiceSample[];
  totalDuration: number;
  qualityScore?: number;
  authorizationType: VoiceAuthorizationType;
  authorizerRelationship?: FamilyRelationship;
  proofDocumentUrl?: string;
  proofDocumentType?: ProofDocumentType;
  verificationStatus: VoiceVerificationStatus;
  verifiedAt?: Date;
  rejectionReason?: string;
  generationCount: number;
  lastGeneratedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
}

// Voice generation request
export interface VoiceGenerationRequest {
  voiceProfileId: string;
  messageText: string;
  occasion?: VoiceOccasion;
}

// Voice generation result
export interface VoiceGeneration {
  id: string;
  voiceProfileId: string;
  generatedByUserId: string;
  messageText: string;
  audioUrl: string;
  duration: number;
  occasion?: VoiceOccasion;
  createdAt: Date;
}

// Occasion types for generated messages
export type VoiceOccasion =
  | "birthday"
  | "anniversary"
  | "graduation"
  | "wedding"
  | "holiday"
  | "memorial_day"
  | "custom";

// Consent flow step types
export type ConsentFlowStep =
  | "intro"
  | "authorization_type"
  | "relationship"
  | "document_upload"
  | "acknowledgments"
  | "complete";

// Family authorization form data
export interface FamilyAuthorizationData {
  authorizationType: VoiceAuthorizationType;
  relationship: FamilyRelationship;
  proofDocumentType: ProofDocumentType;
  proofDocumentUrl?: string;
  agreedToTerms: boolean;
  acknowledgedAI: boolean;
  acknowledgedRevocable: boolean;
  acknowledgedResponsibility: boolean;
}

// Rate limit configuration
export interface VoiceRateLimits {
  perDay: number;
  perMonth: number;
}

export const VOICE_RATE_LIMITS: Record<string, VoiceRateLimits> = {
  free: { perDay: 3, perMonth: 10 },
  remember: { perDay: 10, perMonth: 50 },
  heritage: { perDay: 25, perMonth: 200 },
  legacy: { perDay: 100, perMonth: 1000 },
};

// Minimum sample requirements
export const VOICE_SAMPLE_REQUIREMENTS = {
  minDuration: 10, // seconds minimum per sample
  minTotalDuration: 30, // seconds total minimum
  recommendedTotalDuration: 120, // 2 minutes recommended
  maxSamples: 10,
  maxSampleSize: 50 * 1024 * 1024, // 50MB per sample
  allowedFormats: ["audio/wav", "audio/mp3", "audio/m4a", "audio/webm"],
};

// Quality thresholds
export const VOICE_QUALITY_THRESHOLDS = {
  low: 0.3,
  medium: 0.6,
  high: 0.8,
};

// Helper functions
export function getRelationshipLabel(relationship: FamilyRelationship): string {
  const labels: Record<FamilyRelationship, string> = {
    spouse: "Spouse/Partner",
    child: "Child",
    parent: "Parent",
    sibling: "Sibling",
    grandchild: "Grandchild",
    grandparent: "Grandparent",
    legal_guardian: "Legal Guardian",
    executor: "Estate Executor",
    power_of_attorney: "Power of Attorney",
    other: "Other Family Member",
  };
  return labels[relationship];
}

export function getDocumentTypeLabel(docType: ProofDocumentType): string {
  const labels: Record<ProofDocumentType, string> = {
    death_certificate: "Death Certificate",
    will: "Will/Estate Documents",
    power_of_attorney: "Power of Attorney",
    written_permission: "Written Permission from Deceased",
    funeral_home_letter: "Funeral Home Letter",
    other: "Other Documentation",
  };
  return labels[docType];
}

export function getOccasionLabel(occasion: VoiceOccasion): string {
  const labels: Record<VoiceOccasion, string> = {
    birthday: "Birthday",
    anniversary: "Anniversary",
    graduation: "Graduation",
    wedding: "Wedding",
    holiday: "Holiday",
    memorial_day: "Memorial Day",
    custom: "Custom Message",
  };
  return labels[occasion];
}

export function canGenerateVoice(
  profile: VoiceProfile,
  userTier: string
): { allowed: boolean; reason?: string } {
  // Check if profile is verified
  if (profile.verificationStatus !== "verified") {
    return {
      allowed: false,
      reason: "Voice profile has not been verified yet",
    };
  }

  // Check if profile is revoked
  if (profile.revokedAt) {
    return {
      allowed: false,
      reason: "Voice profile consent has been revoked",
    };
  }

  // Check if there are enough samples
  if (profile.totalDuration < VOICE_SAMPLE_REQUIREMENTS.minTotalDuration) {
    return {
      allowed: false,
      reason: `Need at least ${VOICE_SAMPLE_REQUIREMENTS.minTotalDuration} seconds of voice samples`,
    };
  }

  // Check rate limits (would need actual usage data)
  const _limits = VOICE_RATE_LIMITS[userTier] || VOICE_RATE_LIMITS.free;
  // Note: Actual rate limit checking would require database queries

  return { allowed: true };
}
