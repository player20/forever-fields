import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// SadTalker - Animate photos with audio to create talking head videos
// Creates realistic face animations from a single photo + audio

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const {
      imageUrl,
      audioUrl,
      enhanceFace = true,
      stillMode = false,
      preprocess = "crop",
    } = await request.json();

    if (!imageUrl || !audioUrl) {
      return NextResponse.json(
        { error: "Image URL and audio URL are required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      // Return mock response for demo mode
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable photo animation",
        videoUrl: null,
        imageUrl,
        audioUrl,
      });
    }

    // Run SadTalker to animate the photo
    const output = await replicate.run(
      "cjwbw/sadtalker:3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
      {
        input: {
          // Source image (face to animate)
          source_image: imageUrl,
          // Driving audio (voice to lip-sync)
          driven_audio: audioUrl,
          // Face enhancement for better quality
          enhancer: enhanceFace ? "gfpgan" : null,
          // Still mode = less head movement, more stable
          still: stillMode,
          // Preprocessing: "crop" (face only), "resize" (full image), "full" (no crop)
          preprocess: preprocess,
          // Expression scale (how much the face moves)
          expression_scale: 1.0,
        },
      }
    );

    return NextResponse.json({
      success: true,
      videoUrl: output,
      imageUrl,
      audioUrl,
    });
  } catch (error) {
    console.error("Photo animation error:", error);
    return NextResponse.json(
      { error: "Failed to animate photo" },
      { status: 500 }
    );
  }
}

// LivePortrait alternative (newer, potentially better quality)
export async function PUT(request: NextRequest) {
  try {
    const {
      imageUrl,
      audioUrl,
      expressionScale = 1.0,
    } = await request.json();

    if (!imageUrl || !audioUrl) {
      return NextResponse.json(
        { error: "Image URL and audio URL are required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable photo animation",
        videoUrl: null,
      });
    }

    // Run LivePortrait for higher quality animation
    const output = await replicate.run(
      "fofr/live-portrait:067dd98cc3e5cb396c4a9efb4bba3ecc6c3f9c3d6b3c5c4c4c4c4c4c4c4c4c4c", // Replace with actual model ID
      {
        input: {
          face_image: imageUrl,
          driving_audio: audioUrl,
          expression_scale: expressionScale,
        },
      }
    );

    return NextResponse.json({
      success: true,
      videoUrl: output,
    });
  } catch (error) {
    console.error("LivePortrait error:", error);
    return NextResponse.json(
      { error: "Failed to animate with LivePortrait" },
      { status: 500 }
    );
  }
}
