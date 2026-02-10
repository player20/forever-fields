// Voice Samples API
// Upload, list, and delete voice samples for cloning

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, optionalAuth } from "@/lib/supabase/server";
import { addVoiceSample, removeVoiceSample, getVoiceProfile } from "@/lib/voice/consent";
import { extractRequestInfo } from "@/lib/audit";
import { VOICE_SAMPLE_REQUIREMENTS } from "@/lib/voice/types";
import { DEMO_MODE } from "@/lib/constants";

// GET /api/voice/samples - List voice samples for a memorial
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

    const profile = await getVoiceProfile(memorialId);

    if (!profile) {
      return NextResponse.json({
        samples: [],
        totalDuration: 0,
        requirements: VOICE_SAMPLE_REQUIREMENTS,
      });
    }

    return NextResponse.json({
      samples: profile.samples,
      totalDuration: profile.totalDuration,
      requirements: VOICE_SAMPLE_REQUIREMENTS,
      meetsMinimum: profile.totalDuration >= VOICE_SAMPLE_REQUIREMENTS.minTotalDuration,
      meetsRecommended: profile.totalDuration >= VOICE_SAMPLE_REQUIREMENTS.recommendedTotalDuration,
    });
  } catch (error) {
    console.error("Error fetching voice samples:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice samples" },
      { status: 500 }
    );
  }
}

// POST /api/voice/samples - Upload a voice sample
export async function POST(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user?.id || "demo-user";
    const formData = await request.formData();
    const memorialId = formData.get("memorialId") as string;
    const file = formData.get("file") as File;
    const duration = parseFloat(formData.get("duration") as string);

    if (!memorialId) {
      return NextResponse.json(
        { error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = VOICE_SAMPLE_REQUIREMENTS.allowedFormats;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > VOICE_SAMPLE_REQUIREMENTS.maxSampleSize) {
      return NextResponse.json(
        { error: `File too large. Maximum ${VOICE_SAMPLE_REQUIREMENTS.maxSampleSize / 1024 / 1024}MB allowed.` },
        { status: 400 }
      );
    }

    // Validate duration
    if (!duration || duration < VOICE_SAMPLE_REQUIREMENTS.minDuration) {
      return NextResponse.json(
        { error: `Sample too short. Minimum ${VOICE_SAMPLE_REQUIREMENTS.minDuration} seconds required.` },
        { status: 400 }
      );
    }

    // Check voice profile exists
    const profile = await getVoiceProfile(memorialId);
    if (!profile) {
      return NextResponse.json(
        { error: "Voice consent not initialized. Please complete the consent flow first." },
        { status: 400 }
      );
    }

    let sampleUrl: string;

    if (DEMO_MODE) {
      // Demo mode: fake URL
      sampleUrl = `https://demo.foreverfields.com/voice-samples/${memorialId}/${Date.now()}.wav`;
    } else {
      // Upload to Supabase Storage
      const supabase = await createServerSupabaseClient();
      const fileName = `${memorialId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("voice-samples")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload audio file" },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from("voice-samples")
        .getPublicUrl(fileName);

      sampleUrl = urlData.publicUrl;
    }

    // Add sample to profile
    const requestInfo = extractRequestInfo(request);
    const result = await addVoiceSample(
      memorialId,
      userId,
      sampleUrl,
      duration,
      requestInfo
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get updated profile
    const updatedProfile = await getVoiceProfile(memorialId);

    return NextResponse.json({
      success: true,
      sampleUrl,
      duration,
      totalDuration: updatedProfile?.totalDuration || duration,
      sampleCount: updatedProfile?.samples.length || 1,
      meetsMinimum: (updatedProfile?.totalDuration || 0) >= VOICE_SAMPLE_REQUIREMENTS.minTotalDuration,
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading voice sample:", error);
    return NextResponse.json(
      { error: "Failed to upload voice sample" },
      { status: 500 }
    );
  }
}

// DELETE /api/voice/samples - Delete a voice sample
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await optionalAuth();

    if (!user && !DEMO_MODE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user?.id || "demo-user";
    const body = await request.json();
    const { memorialId, sampleId } = body;

    if (!memorialId || !sampleId) {
      return NextResponse.json(
        { error: "Memorial ID and sample ID are required" },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfo(request);
    const result = await removeVoiceSample(memorialId, userId, sampleId, requestInfo);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get updated profile
    const updatedProfile = await getVoiceProfile(memorialId);

    return NextResponse.json({
      success: true,
      totalDuration: updatedProfile?.totalDuration || 0,
      sampleCount: updatedProfile?.samples.length || 0,
    });
  } catch (error) {
    console.error("Error deleting voice sample:", error);
    return NextResponse.json(
      { error: "Failed to delete voice sample" },
      { status: 500 }
    );
  }
}
