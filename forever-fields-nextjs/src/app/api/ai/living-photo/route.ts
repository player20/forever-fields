import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Create subtle "living" photo animations using Live Portrait
// Uses a driving video with minimal head movement + expression retargeting

// Driving video with minimal movement - we reduce intensity via parameters
const DRIVING_VIDEO_URL = "https://replicate.delivery/pbxt/LEQxLFMUNZMiKt5PWjyMJIbTdvKAb5j3f0spuiEwt9TEbo8B/d0.mp4";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: "REPLICATE_API_TOKEN not configured",
      }, { status: 500 });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("Starting Live Portrait generation for:", imageUrl);

    // Create prediction with subtle expression settings
    const prediction = await replicate.predictions.create({
      version: "067dd98cc3e5cb396c4a9efb4bba3eec6c4a9d271211325c477518fc6485e146",
      input: {
        face_image: imageUrl,
        driving_video: DRIVING_VIDEO_URL,

        // Enable lip/smile retargeting with gentle intensity
        live_portrait_lip_retargeting: true,
        live_portrait_lip_retargeting_multiplier: 0.5, // Gentle smile (50% intensity)

        // Enable eye movement for natural blinking
        live_portrait_eye_retargeting: true,
        live_portrait_eyes_retargeting_multiplier: 0.6, // Natural eye movement

        // Use relative mode for more natural movement
        live_portrait_relative: true,
        live_portrait_stitching: true,

        // More frames for smoother animation
        video_frame_load_cap: 120,
        video_select_every_n_frames: 1, // Keep all frames for smoothness
      },
    });

    console.log("Prediction created:", prediction.id, "status:", prediction.status);

    // Wait for completion
    const result = await replicate.wait(prediction);

    console.log("Prediction completed:", result.status, "output:", result.output);

    if (result.status === "failed") {
      console.error("Prediction failed:", result.error);
      return NextResponse.json({
        success: false,
        error: result.error || "Model prediction failed",
      }, { status: 500 });
    }

    // Extract video URL from output
    let videoUrl: string | null = null;
    const output = result.output;

    if (typeof output === "string") {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      for (const item of output) {
        if (typeof item === "string" && item.includes(".mp4")) {
          videoUrl = item;
          break;
        }
      }
      if (!videoUrl && typeof output[0] === "string") {
        videoUrl = output[0];
      }
    } else if (output && typeof output === "object") {
      const obj = output as Record<string, unknown>;
      videoUrl = (obj.url || obj.output || obj.video) as string | null;
    }

    if (!videoUrl) {
      console.error("Could not extract video URL from output:", output);
      return NextResponse.json({
        success: false,
        error: "Failed to get video URL from AI response",
        rawOutput: JSON.stringify(output),
      }, { status: 500 });
    }

    console.log("Live Portrait video URL:", videoUrl);

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      thumbnailUrl: imageUrl,
    });
  } catch (error) {
    console.error("Living photo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create living photo" },
      { status: 500 }
    );
  }
}
