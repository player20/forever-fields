import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// GFPGAN face restoration via Replicate
// Restores blurry/damaged faces in old photos

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, version, scale } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      // Return mock response for demo mode
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable actual face restoration",
        originalUrl: imageUrl,
        restoredUrl: imageUrl,
      });
    }

    // Run GFPGAN face restoration
    const output = await replicate.run(
      "tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
      {
        input: {
          img: imageUrl,
          version: version || "v1.4", // v1.2, v1.3, v1.4 (newest)
          scale: scale || 2, // 1, 2, 4 (upscaling factor)
        },
      }
    );

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      restoredUrl: output,
    });
  } catch (error) {
    console.error("Face restoration error:", error);
    return NextResponse.json(
      { error: "Failed to restore faces" },
      { status: 500 }
    );
  }
}
