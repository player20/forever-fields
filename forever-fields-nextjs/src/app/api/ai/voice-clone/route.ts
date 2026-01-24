import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Voice cloning via Replicate
// Uses F5-TTS for zero-shot voice cloning from short audio samples

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const {
      referenceAudioUrl,
      referenceText,
      targetText,
      speed = 1.0,
    } = await request.json();

    if (!referenceAudioUrl || !targetText) {
      return NextResponse.json(
        { error: "Reference audio URL and target text are required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      // Return mock response for demo mode
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable actual voice cloning",
        audioUrl: null,
        text: targetText,
      });
    }

    // Run F5-TTS voice cloning
    // This model can clone voice from just 3 seconds of audio
    const output = await replicate.run(
      "lucataco/f5-tts:c1b78f68e8c9e3a3ec0bf8ae40b67d026a3c2b5b329e74e9bf9b52d8defc15e3",
      {
        input: {
          // Reference audio for voice cloning
          ref_audio_input: referenceAudioUrl,
          // Optional: text from the reference audio (improves quality)
          ref_text_input: referenceText || "",
          // Text to synthesize in the cloned voice
          gen_text_input: targetText,
          // Speed multiplier
          speed: speed,
          // Remove silence
          remove_silence: true,
        },
      }
    );

    return NextResponse.json({
      success: true,
      audioUrl: output,
      text: targetText,
    });
  } catch (error) {
    console.error("Voice cloning error:", error);
    return NextResponse.json(
      { error: "Failed to clone voice" },
      { status: 500 }
    );
  }
}

// Alternative endpoint for Chatterbox (emotion control)
export async function PUT(request: NextRequest) {
  try {
    const {
      referenceAudioUrl,
      targetText,
      emotion = "neutral",
      exaggeration = 0.5,
    } = await request.json();

    if (!referenceAudioUrl || !targetText) {
      return NextResponse.json(
        { error: "Reference audio URL and target text are required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable actual voice cloning",
        audioUrl: null,
        text: targetText,
        emotion,
      });
    }

    // Run Chatterbox with emotion control
    const output = await replicate.run(
      "cjwbw/chatterbox:voice-cloning-model-id", // Replace with actual model ID
      {
        input: {
          audio: referenceAudioUrl,
          text: targetText,
          emotion: emotion, // happy, sad, excited, calm, etc.
          exaggeration: exaggeration, // 0-1, how much to exaggerate emotion
        },
      }
    );

    return NextResponse.json({
      success: true,
      audioUrl: output,
      text: targetText,
      emotion,
    });
  } catch (error) {
    console.error("Voice cloning error:", error);
    return NextResponse.json(
      { error: "Failed to clone voice with emotion" },
      { status: 500 }
    );
  }
}
