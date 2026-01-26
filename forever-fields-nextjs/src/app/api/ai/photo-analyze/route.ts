import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/supabase/server";

// Claude Vision for photo analysis
// - Auto-generate captions
// - Estimate decade from photo style
// - Detect setting, mood, and people

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, imageBase64, analysisType } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Image URL or base64 data is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock response for demo mode
      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Set ANTHROPIC_API_KEY to enable actual photo analysis",
        caption: "A cherished family moment captured in time.",
        estimatedDecade: "1960s",
        setting: "Outdoor gathering",
        mood: "Joyful",
        numberOfPeople: 3,
        suggestions: [
          "This appears to be a family gathering",
          "The clothing style suggests mid-20th century",
          "Consider adding names if you recognize the people"
        ],
      });
    }

    // Build image content based on input type
    const imageContent = imageBase64
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: "image/jpeg" as const,
            data: imageBase64,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "url" as const,
            url: imageUrl,
          },
        };

    // Different prompts for different analysis types
    const prompts: Record<string, string> = {
      caption: `Analyze this photo and provide:
1. A warm, emotional caption (1-2 sentences) suitable for a memorial page
2. Your best estimate of when this photo was taken (decade)
3. The setting (indoor/outdoor, location type)
4. The overall mood
5. Approximate number of people visible

Respond in JSON format:
{
  "caption": "string",
  "estimatedDecade": "string (e.g., '1960s', '1970s-1980s')",
  "setting": "string",
  "mood": "string",
  "numberOfPeople": number,
  "suggestions": ["array of helpful suggestions for the memorial"]
}`,

      decade: `Analyze the visual elements of this photo (clothing styles, hairstyles, photo quality, color/sepia tones, objects visible) and estimate when it was taken.

Respond in JSON format:
{
  "estimatedDecade": "string (e.g., '1950s', 'early 1960s')",
  "confidence": "high/medium/low",
  "reasons": ["array of visual clues that led to this estimate"]
}`,

      people: `Describe the people visible in this photo. Do NOT try to identify them by name. Focus on:
- Approximate number of people
- Approximate ages (child, young adult, middle-aged, elderly)
- Relationships suggested by body language (family group, couple, etc.)
- Attire and style

Respond in JSON format:
{
  "numberOfPeople": number,
  "descriptions": ["array of descriptions for each person"],
  "suggestedRelationships": "string describing apparent relationships",
  "occasion": "string suggesting what type of event this might be"
}`,
    };

    const prompt = prompts[analysisType] || prompts.caption;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Try to parse as JSON
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       textContent.text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
      analysis = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return raw text
      analysis = {
        caption: textContent.text,
        raw: true,
      };
    }

    return NextResponse.json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    console.error("Photo analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 }
    );
  }
}
