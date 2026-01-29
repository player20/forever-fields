/**
 * Voice Module
 *
 * Re-exports all voice cloning utilities.
 */

// Types
export * from "./types";

// Consent utilities
export {
  checkVoiceConsent,
  initializeVoiceConsent,
  getVoiceProfile,
  addVoiceSample,
  removeVoiceSample,
  verifyVoiceAuthorization,
  revokeVoiceConsent,
  getPendingVoiceVerifications,
  hasSufficientSamples,
  getSampleQualityMessage,
} from "./consent";

// Watermarking
export {
  createWatermarkMetadata,
  encodeMetadata,
  decodeMetadata,
  watermarkAudio,
  verifyWatermark,
  generateDisclaimer,
  prependDisclaimer,
  addInaudibleWatermark,
  detectInaudibleWatermark,
  checkAudioQualityForWatermarking,
} from "./watermark";
