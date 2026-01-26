import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { requireAuth } from "@/lib/supabase/server";

// DeOldify colorization via Replicate
// Model: arielreplicate/deoldify_image

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, renderFactor } = await request.json();

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
        message: "Demo mode: Set REPLICATE_API_TOKEN to enable actual colorization",
        originalUrl: imageUrl,
        colorizedUrl: imageUrl, // In demo, return same image
      });
    }

    // Run DeOldify colorization
    const output = await replicate.run(
      "arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950",
      {
        input: {
          input_image: imageUrl,
          render_factor: renderFactor || 35, // 7-40, higher = better quality but slower
        },
      }
    );

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      colorizedUrl: output,
    });
  } catch (error) {
    console.error("Colorization error:", error);
    return NextResponse.json(
      { error: "Failed to colorize image" },
      { status: 500 }
    );
  }
}
