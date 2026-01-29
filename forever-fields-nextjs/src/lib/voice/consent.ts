/**
 * Voice Consent Management
 *
 * Utilities for managing voice cloning consent and authorization.
 * Handles the family authorization workflow and verification.
 */

import {
  VoiceAuthorizationType,
  VoiceProfile,
  VoiceVerificationStatus as _VoiceVerificationStatus,
  FamilyRelationship as _FamilyRelationship,
  ProofDocumentType as _ProofDocumentType,
  FamilyAuthorizationData,
  VOICE_SAMPLE_REQUIREMENTS,
} from "./types";
import { logVoiceEvent, giveConsent, hasValidConsent } from "@/lib/audit";

// Demo mode
const DEMO_MODE = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoVoiceProfiles: Map<string, VoiceProfile> = new Map();

/**
 * Check if voice consent exists and is valid
 */
export async function checkVoiceConsent(
  userId: string,
  memorialId: string
): Promise<{
  hasConsent: boolean;
  profile?: VoiceProfile;
  needsVerification?: boolean;
  reason?: string;
}> {
  // Check consent record
  const consentResult = await hasValidConsent(userId, "VOICE_FAMILY", memorialId);

  if (!consentResult.hasConsent) {
    return {
      hasConsent: false,
      reason: consentResult.reason || "No voice consent found",
    };
  }

  // Get voice profile
  const profile = await getVoiceProfile(memorialId);

  if (!profile) {
    return {
      hasConsent: false,
      reason: "Voice consent exists but no profile created yet",
    };
  }

  if (profile.verificationStatus === "pending") {
    return {
      hasConsent: false,
      profile,
      needsVerification: true,
      reason: "Voice authorization is pending verification",
    };
  }

  if (profile.verificationStatus === "rejected") {
    return {
      hasConsent: false,
      profile,
      reason: profile.rejectionReason || "Voice authorization was rejected",
    };
  }

  if (profile.revokedAt) {
    return {
      hasConsent: false,
      profile,
      reason: "Voice consent has been revoked",
    };
  }

  return {
    hasConsent: true,
    profile,
  };
}

/**
 * Initialize voice consent for a memorial
 */
export async function initializeVoiceConsent(
  userId: string,
  memorialId: string,
  authData: FamilyAuthorizationData,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  try {
    // First, create the consent record
    const consentType =
      authData.authorizationType === "self_recorded"
        ? "VOICE_SELF"
        : "VOICE_FAMILY";

    await giveConsent(
      {
        userId,
        memorialId,
        consentType,
        consentVersion: "1.0",
        consentText: getVoiceConsentText(authData.authorizationType),
        authorizationType: authData.authorizationType,
        proofDocumentUrl: authData.proofDocumentUrl,
        relationshipToDeceased: authData.relationship,
      },
      requestInfo
    );

    // Create voice profile
    const profile: VoiceProfile = {
      id: crypto.randomUUID(),
      memorialId,
      createdByUserId: userId,
      samples: [],
      totalDuration: 0,
      authorizationType: authData.authorizationType,
      authorizerRelationship: authData.relationship,
      proofDocumentUrl: authData.proofDocumentUrl,
      proofDocumentType: authData.proofDocumentType,
      verificationStatus:
        authData.authorizationType === "self_recorded" ? "verified" : "pending",
      generationCount: 0,
      createdAt: new Date(),
    };

    if (DEMO_MODE) {
      demoVoiceProfiles.set(memorialId, profile);
    }

    // Log the event
    await logVoiceEvent(
      "VOICE_SAMPLE_UPLOADED",
      userId,
      memorialId,
      {
        action: "consent_initialized",
        authorizationType: authData.authorizationType,
      },
      requestInfo
    );

    return { success: true, profileId: profile.id };
  } catch (error) {
    console.error("Failed to initialize voice consent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize consent",
    };
  }
}

/**
 * Get voice profile for a memorial
 */
export async function getVoiceProfile(
  memorialId: string
): Promise<VoiceProfile | null> {
  if (DEMO_MODE) {
    return demoVoiceProfiles.get(memorialId) || null;
  }

  // Production: Query database
  return null;
}

/**
 * Add voice sample to profile
 */
export async function addVoiceSample(
  memorialId: string,
  userId: string,
  sampleUrl: string,
  duration: number,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getVoiceProfile(memorialId);

  if (!profile) {
    return { success: false, error: "Voice profile not found" };
  }

  if (profile.revokedAt) {
    return { success: false, error: "Voice consent has been revoked" };
  }

  // Validate sample
  if (duration < VOICE_SAMPLE_REQUIREMENTS.minDuration) {
    return {
      success: false,
      error: `Sample too short. Minimum ${VOICE_SAMPLE_REQUIREMENTS.minDuration} seconds required.`,
    };
  }

  if (profile.samples.length >= VOICE_SAMPLE_REQUIREMENTS.maxSamples) {
    return {
      success: false,
      error: `Maximum ${VOICE_SAMPLE_REQUIREMENTS.maxSamples} samples allowed.`,
    };
  }

  // Add sample
  const newSample = {
    id: crypto.randomUUID(),
    url: sampleUrl,
    duration,
    uploadedAt: new Date(),
  };

  if (DEMO_MODE) {
    profile.samples.push(newSample);
    profile.totalDuration += duration;
    demoVoiceProfiles.set(memorialId, profile);
  }

  // Log the event
  await logVoiceEvent(
    "VOICE_SAMPLE_UPLOADED",
    userId,
    memorialId,
    { sampleId: newSample.id, duration },
    requestInfo
  );

  return { success: true };
}

/**
 * Remove voice sample from profile
 */
export async function removeVoiceSample(
  memorialId: string,
  userId: string,
  sampleId: string,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getVoiceProfile(memorialId);

  if (!profile) {
    return { success: false, error: "Voice profile not found" };
  }

  const sampleIndex = profile.samples.findIndex((s) => s.id === sampleId);
  if (sampleIndex === -1) {
    return { success: false, error: "Sample not found" };
  }

  const removedSample = profile.samples[sampleIndex];

  if (DEMO_MODE) {
    profile.samples.splice(sampleIndex, 1);
    profile.totalDuration -= removedSample.duration;
    demoVoiceProfiles.set(memorialId, profile);
  }

  // Log the event
  await logVoiceEvent(
    "VOICE_SAMPLE_DELETED",
    userId,
    memorialId,
    { sampleId },
    requestInfo
  );

  return { success: true };
}

/**
 * Verify family authorization (admin action)
 */
export async function verifyVoiceAuthorization(
  memorialId: string,
  adminUserId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getVoiceProfile(memorialId);

  if (!profile) {
    return { success: false, error: "Voice profile not found" };
  }

  if (DEMO_MODE) {
    if (approved) {
      profile.verificationStatus = "verified";
      profile.verifiedAt = new Date();
    } else {
      profile.verificationStatus = "rejected";
      profile.rejectionReason = rejectionReason;
    }
    demoVoiceProfiles.set(memorialId, profile);
  }

  return { success: true };
}

/**
 * Revoke voice consent
 */
export async function revokeVoiceConsent(
  memorialId: string,
  userId: string,
  reason: string,
  requestInfo?: { ipAddress?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getVoiceProfile(memorialId);

  if (!profile) {
    return { success: false, error: "Voice profile not found" };
  }

  if (DEMO_MODE) {
    profile.revokedAt = new Date();
    profile.revokedReason = reason;
    // Clear samples on revocation
    profile.samples = [];
    profile.totalDuration = 0;
    demoVoiceProfiles.set(memorialId, profile);
  }

  // Log the event
  await logVoiceEvent(
    "VOICE_SAMPLE_DELETED",
    userId,
    memorialId,
    { action: "consent_revoked", reason },
    requestInfo
  );

  return { success: true };
}

/**
 * Get pending verifications (admin)
 */
export async function getPendingVoiceVerifications(): Promise<VoiceProfile[]> {
  if (DEMO_MODE) {
    return Array.from(demoVoiceProfiles.values()).filter(
      (p) => p.verificationStatus === "pending"
    );
  }

  return [];
}

/**
 * Get consent text for voice authorization type
 */
function getVoiceConsentText(authType: VoiceAuthorizationType): string {
  const texts: Record<VoiceAuthorizationType, string> = {
    self_recorded: `I confirm that I am recording my own voice for use in creating AI-generated voice messages. I understand that:
- My voice samples will be used to train an AI model to generate messages that sound like me
- The generated messages may not perfectly replicate my actual voice
- I can revoke this consent at any time, which will delete my voice samples
- Generated messages will be clearly marked as AI-generated`,

    family_authorized: `I confirm that I have legal authority to authorize voice reproduction for the deceased individual named in this memorial. I understand that:
- Voice samples will be used to generate AI messages that approximate the deceased's voice
- This cannot perfectly replicate their actual voice and may contain inaccuracies
- I accept responsibility for appropriate use of generated audio within authorized circles
- I can revoke this authorization at any time
- All generated content will be clearly marked as AI-generated`,

    pre_mortem_consent: `I am uploading voice samples based on consent given by the deceased before their passing. I understand that:
- I must provide documentation of this consent
- Voice samples will be used to generate AI messages
- This cannot perfectly replicate their actual voice
- I accept responsibility for honoring their wishes regarding voice use
- All generated content will be clearly marked as AI-generated`,
  };

  return texts[authType];
}

/**
 * Check if voice profile has sufficient samples for generation
 */
export function hasSufficientSamples(profile: VoiceProfile): boolean {
  return profile.totalDuration >= VOICE_SAMPLE_REQUIREMENTS.minTotalDuration;
}

/**
 * Get sample quality message
 */
export function getSampleQualityMessage(profile: VoiceProfile): string {
  const { totalDuration } = profile;
  const { minTotalDuration, recommendedTotalDuration } = VOICE_SAMPLE_REQUIREMENTS;

  if (totalDuration < minTotalDuration) {
    const needed = minTotalDuration - totalDuration;
    return `Need ${needed} more seconds of audio (minimum ${minTotalDuration}s required)`;
  }

  if (totalDuration < recommendedTotalDuration) {
    const moreNeeded = recommendedTotalDuration - totalDuration;
    return `Good start! Adding ${moreNeeded} more seconds will improve quality.`;
  }

  return "Excellent! You have enough samples for high-quality voice generation.";
}
