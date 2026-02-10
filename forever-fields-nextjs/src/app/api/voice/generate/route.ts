// Voice Generation API
// Generate voice messages using cloned voice with consent verification

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { optionalAuth } from "@/lib/supabase/server";
import { checkVoiceConsent, getVoiceProfile } from "@/lib/voice/consent";
import { logVoiceEvent, extractRequestInfo } from "@/lib/audit";
import { canGenerateVoice, VOICE_SAMPLE_REQUIREMENTS, VoiceOccasion } from "@/lib/voice/types";
import { DEMO_MODE } from "@/lib/constants";

// In-memory store for demo mode generations
const demoGenerations: Map<string, Array<{
  id: string;
  memorialId: string;
  messageText: string;
  audioUrl: string;
  occasion?: VoiceOccasion;
  createdAt: string;
}>> = new Map();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// POST /api/voice/generate - Generate voice message
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user?.id || "demo-user";
    const body = await request.json();
    const { memorialId, messageText, occasion, speed = 1.0 } = body;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (!messageText || messageText.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    if (messageText.length > 1000) {
      return NextResponse.json(
        { error: "Message too long. Maximum 1000 characters." },
        { status: 400 }
      );
    }

    // Check consent
    const consentResult = await checkVoiceConsent(userId, memorialId);
    if (!consentResult.hasConsent) {
      return NextResponse.json(
        { error: consentResult.reason || "Voice consent not granted" },
        { status: 403 }
      );
    }

    // Get voice profile
    const profile = await getVoiceProfile(memorialId);
    if (!profile) {
      return NextResponse.json(
        { error: "Voice profile not found" },
        { status: 404 }
      );
    }

    // Check if generation is allowed
    const generationCheck = canGenerateVoice(profile, "free"); // TODO: Get actual user tier
    if (!generationCheck.allowed) {
      return NextResponse.json(
        { error: generationCheck.reason },
        { status: 403 }
      );
    }

    // Check for sufficient samples
    if (profile.totalDuration < VOICE_SAMPLE_REQUIREMENTS.minTotalDuration) {
      return NextResponse.json(
        { error: `Need at least ${VOICE_SAMPLE_REQUIREMENTS.minTotalDuration} seconds of voice samples` },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfo(request);

    // Demo mode or no API key
    if (DEMO_MODE || !process.env.REPLICATE_API_TOKEN) {
      const generation = {
        id: `gen-${Date.now()}`,
        memorialId,
        messageText,
        audioUrl: `https://demo.foreverfields.com/voice-generations/${memorialId}/${Date.now()}.wav`,
        occasion: occasion as VoiceOccasion | undefined,
        createdAt: new Date().toISOString(),
      };

      const existing = demoGenerations.get(memorialId) || [];
      demoGenerations.set(memorialId, [generation, ...existing]);

      // Log the event
      await logVoiceEvent(
        "VOICE_MESSAGE_GENERATED",
        userId,
        memorialId,
        { generationId: generation.id, messageLength: messageText.length, demo: true },
        requestInfo
      );

      return NextResponse.json({
        success: true,
        demo: !process.env.REPLICATE_API_TOKEN,
        generation,
        message: DEMO_MODE
          ? "Demo mode: Voice generation simulated"
          : "Set REPLICATE_API_TOKEN to enable actual voice generation",
      }, { status: 201 });
    }

    // Get the best sample for reference
    const bestSample = profile.samples[0]; // In production, pick highest quality
    if (!bestSample) {
      return NextResponse.json(
        { error: "No voice samples available" },
        { status: 400 }
      );
    }

    // Call Replicate F5-TTS
    const output = await replicate.run(
      "lucataco/f5-tts:c1b78f68e8c9e3a3ec0bf8ae40b67d026a3c2b5b329e74e9bf9b52d8defc15e3",
      {
        input: {
          ref_audio_input: bestSample.url,
          ref_text_input: "", // Could include transcription of sample for better quality
          gen_text_input: messageText,
          speed: speed,
          remove_silence: true,
        },
      }
    );

    const audioUrl = output as string;

    const generation = {
      id: `gen-${Date.now()}`,
      memorialId,
      messageText,
      audioUrl,
      occasion: occasion as VoiceOccasion | undefined,
      createdAt: new Date().toISOString(),
    };

    // Log the event
    await logVoiceEvent(
      "VOICE_MESSAGE_GENERATED",
      userId,
      memorialId,
      { generationId: generation.id, messageLength: messageText.length },
      requestInfo
    );

    return NextResponse.json({
      success: true,
      generation,
    }, { status: 201 });
  } catch (error) {
    console.error("Voice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate voice message" },
      { status: 500 }
    );
  }
}

// GET /api/voice/generate - List generated voice messages
export async function GET(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const generations = demoGenerations.get(memorialId) || [];
      return NextResponse.json({
        generations,
        total: generations.length,
      });
    }

    // In production, query from database
    // const generations = await prisma.voiceGeneration.findMany({
    //   where: { memorialId },
    //   orderBy: { createdAt: 'desc' },
    // });

    return NextResponse.json({
      generations: [],
      total: 0,
    });
  } catch (error) {
    console.error("Error fetching voice generations:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice generations" },
      { status: 500 }
    );
  }
}
