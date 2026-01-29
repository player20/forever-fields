/**
 * Audio Watermarking
 *
 * Utilities for marking AI-generated voice content.
 * Embeds metadata to identify Forever Fields generated audio.
 *
 * Watermarking approaches:
 * 1. Metadata embedding (ID3 tags for MP3, etc.)
 * 2. Optional audible disclaimer
 * 3. Inaudible audio watermark (ultrasonic frequency)
 */

export interface WatermarkMetadata {
  generator: "Forever Fields";
  isAIGenerated: true;
  memorialId: string;
  voiceProfileId: string;
  generatedAt: string; // ISO timestamp
  generatedBy: string; // User ID
  version: string;
}

export interface WatermarkOptions {
  addAudibleDisclaimer?: boolean;
  disclaimerText?: string;
  addInaudibleWatermark?: boolean;
}

const DEFAULT_DISCLAIMER = "This message was generated using AI technology.";

/**
 * Create watermark metadata for an audio file
 */
export function createWatermarkMetadata(
  memorialId: string,
  voiceProfileId: string,
  generatedBy: string
): WatermarkMetadata {
  return {
    generator: "Forever Fields",
    isAIGenerated: true,
    memorialId,
    voiceProfileId,
    generatedAt: new Date().toISOString(),
    generatedBy,
    version: "1.0",
  };
}

/**
 * Encode metadata as a base64 string for embedding
 */
export function encodeMetadata(metadata: WatermarkMetadata): string {
  return Buffer.from(JSON.stringify(metadata)).toString("base64");
}

/**
 * Decode metadata from a base64 string
 */
export function decodeMetadata(encoded: string): WatermarkMetadata | null {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(decoded) as WatermarkMetadata;
  } catch {
    return null;
  }
}

/**
 * Add watermark to audio file (server-side implementation)
 *
 * This is a placeholder for the actual watermarking implementation.
 * In production, this would use a library like ffmpeg to:
 * 1. Add metadata to the audio file
 * 2. Optionally prepend an audible disclaimer
 * 3. Add an inaudible ultrasonic watermark
 */
export async function watermarkAudio(
  audioBuffer: ArrayBuffer,
  metadata: WatermarkMetadata,
  options: WatermarkOptions = {}
): Promise<ArrayBuffer> {
  // In a real implementation, this would:
  // 1. Use ffmpeg or similar to process the audio
  // 2. Add ID3 tags or similar metadata
  // 3. Optionally add audible disclaimer
  // 4. Add inaudible watermark

  // For now, return the original buffer
  // The metadata will be stored separately in the database
  console.log("Watermarking audio with metadata:", metadata);
  console.log("Options:", options);

  // In production, implement actual watermarking:
  // - Use ffmpeg-wasm for browser-side processing
  // - Use fluent-ffmpeg for server-side processing
  // - Add ultrasonic watermark at 18-20kHz range

  return audioBuffer;
}

/**
 * Verify if an audio file has a valid Forever Fields watermark
 */
export async function verifyWatermark(
  _audioBuffer: ArrayBuffer
): Promise<{
  hasWatermark: boolean;
  metadata?: WatermarkMetadata;
}> {
  // In production, this would:
  // 1. Read metadata from the audio file
  // 2. Check for inaudible watermark
  // 3. Verify the generator signature

  // Placeholder implementation
  return {
    hasWatermark: false,
    metadata: undefined,
  };
}

/**
 * Generate an audible disclaimer audio clip
 *
 * In production, this would use text-to-speech to generate
 * a brief disclaimer that can be prepended to the audio.
 */
export async function generateDisclaimer(
  text: string = DEFAULT_DISCLAIMER
): Promise<ArrayBuffer | null> {
  // In production, use a TTS service to generate the disclaimer
  // For now, return null to indicate no disclaimer available
  console.log("Would generate disclaimer:", text);
  return null;
}

/**
 * Prepend disclaimer to audio
 */
export async function prependDisclaimer(
  audioBuffer: ArrayBuffer,
  _disclaimerBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // In production, use ffmpeg to concatenate the audio files
  // For now, return the original audio
  return audioBuffer;
}

/**
 * Add inaudible watermark to audio
 *
 * Uses ultrasonic frequencies (18-20kHz) that are:
 * - Generally inaudible to most adults
 * - Preserved in high-quality audio
 * - Detectable by specialized software
 */
export async function addInaudibleWatermark(
  audioBuffer: ArrayBuffer,
  watermarkId: string
): Promise<ArrayBuffer> {
  // In production, this would:
  // 1. Generate a unique pattern based on the watermarkId
  // 2. Encode it as high-frequency audio (18-20kHz)
  // 3. Mix it into the audio at a very low amplitude

  // This is a placeholder - return original audio
  console.log("Would add inaudible watermark:", watermarkId);
  return audioBuffer;
}

/**
 * Detect inaudible watermark in audio
 */
export async function detectInaudibleWatermark(
  _audioBuffer: ArrayBuffer
): Promise<string | null> {
  // In production, this would:
  // 1. Apply a high-pass filter to isolate ultrasonic frequencies
  // 2. Decode the watermark pattern
  // 3. Return the watermark ID if found

  // Placeholder - return null
  return null;
}

/**
 * Check if audio quality is sufficient for watermarking
 *
 * Low-quality audio (low bitrate, heavy compression) may not
 * preserve inaudible watermarks well.
 */
export function checkAudioQualityForWatermarking(
  sampleRate: number,
  bitrate: number
): {
  suitable: boolean;
  reason?: string;
} {
  // Need at least 44.1kHz sample rate to encode 18-20kHz watermarks
  if (sampleRate < 44100) {
    return {
      suitable: false,
      reason: `Sample rate (${sampleRate}Hz) too low for inaudible watermarking. Need at least 44.1kHz.`,
    };
  }

  // Need reasonable bitrate for watermark preservation
  if (bitrate < 128000) {
    return {
      suitable: false,
      reason: `Bitrate (${bitrate / 1000}kbps) too low. High frequencies may be lost in compression.`,
    };
  }

  return { suitable: true };
}
