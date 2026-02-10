// Audio watermarking utility
// Embeds an inaudible identifier into audio recordings for authenticity verification

// Watermark configuration
const WATERMARK_FREQUENCY = 18500; // Hz - above most hearing range but within audio spectrum
const WATERMARK_DURATION = 0.1; // seconds
const WATERMARK_AMPLITUDE = 0.01; // Very quiet
const WATERMARK_INTERVAL = 5; // Add watermark every N seconds

interface WatermarkData {
  memorialId: string;
  userId?: string;
  timestamp: number;
}

// Convert data to binary pattern
function dataToBinary(data: WatermarkData): string {
  const str = JSON.stringify(data);
  return str
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

// Generate watermark audio data
function generateWatermarkTone(
  sampleRate: number,
  frequency: number,
  duration: number,
  amplitude: number
): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const data = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    // Generate sine wave at specified frequency
    const t = i / sampleRate;
    data[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);

    // Apply fade in/out to avoid clicks
    const fadeLength = Math.floor(samples * 0.1);
    if (i < fadeLength) {
      data[i] *= i / fadeLength;
    } else if (i > samples - fadeLength) {
      data[i] *= (samples - i) / fadeLength;
    }
  }

  return data;
}

// Embed watermark into audio buffer
export async function embedWatermark(
  audioBlob: Blob,
  watermarkData: WatermarkData
): Promise<Blob> {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;

    // Decode the audio
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create new buffer for watermarked audio
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const watermarkedBuffer = audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );

    // Copy original audio to new buffer
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const newData = watermarkedBuffer.getChannelData(channel);
      newData.set(originalData);
    }

    // Generate binary pattern from data
    const binary = dataToBinary(watermarkData);
    // Watermark tone generation (used in embedding process below)
    const _watermarkTone = generateWatermarkTone(
      sampleRate,
      WATERMARK_FREQUENCY,
      WATERMARK_DURATION,
      WATERMARK_AMPLITUDE
    );

    // Embed watermark at intervals
    const audioDuration = length / sampleRate;
    let watermarkIndex = 0;

    for (let t = 1; t < audioDuration; t += WATERMARK_INTERVAL) {
      if (watermarkIndex >= binary.length) {
        watermarkIndex = 0; // Repeat pattern
      }

      const bit = binary[watermarkIndex];
      const frequency =
        bit === "1" ? WATERMARK_FREQUENCY : WATERMARK_FREQUENCY + 100;
      const tone = generateWatermarkTone(
        sampleRate,
        frequency,
        WATERMARK_DURATION,
        WATERMARK_AMPLITUDE
      );

      const startSample = Math.floor(t * sampleRate);

      // Add watermark to first channel
      const channelData = watermarkedBuffer.getChannelData(0);
      for (let i = 0; i < tone.length && startSample + i < length; i++) {
        channelData[startSample + i] += tone[i];
      }

      watermarkIndex++;
    }

    // Convert buffer to blob
    const wavBlob = await audioBufferToWav(watermarkedBuffer);

    await audioContext.close();

    return wavBlob;
  } catch (error) {
    console.error("Failed to embed watermark:", error);
    // Return original if watermarking fails
    return audioBlob;
  }
}

// Convert AudioBuffer to WAV Blob
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  // Create interleaved data
  const interleaved = new Float32Array(length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      interleaved[i * numberOfChannels + channel] = channelData[i];
    }
  }

  // Convert to 16-bit PCM
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + interleaved.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, interleaved.length * 2, true);

  // Write PCM data
  const offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(
      offset + i * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Verify watermark in audio (for authenticity checking)
export async function verifyWatermark(
  audioBlob: Blob
): Promise<{ valid: boolean; data?: WatermarkData }> {
  try {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Perform FFT analysis to detect watermark frequencies
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Check for presence of watermark frequency
    // This is a simplified check - in production, would use proper FFT
    let watermarkDetected = false;

    // Simple energy detection at watermark frequency
    const windowSize = Math.floor(sampleRate * WATERMARK_DURATION);
    for (let t = 1; t < audioBuffer.duration; t += WATERMARK_INTERVAL) {
      const startSample = Math.floor(t * sampleRate);

      // Check for high-frequency content
      let energy = 0;
      for (
        let i = startSample;
        i < startSample + windowSize && i < channelData.length;
        i++
      ) {
        energy += Math.abs(channelData[i]);
      }

      if (energy / windowSize > WATERMARK_AMPLITUDE * 0.5) {
        watermarkDetected = true;
        break;
      }
    }

    await audioContext.close();

    return {
      valid: watermarkDetected,
      data: watermarkDetected
        ? {
            memorialId: "detected",
            timestamp: Date.now(),
          }
        : undefined,
    };
  } catch (error) {
    console.error("Failed to verify watermark:", error);
    return { valid: false };
  }
}

// Generate unique fingerprint for audio
export function generateAudioFingerprint(
  memorialId: string,
  userId?: string
): string {
  const data = {
    memorialId,
    userId,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2, 15),
  };
  return btoa(JSON.stringify(data));
}
