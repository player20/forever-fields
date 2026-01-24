import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Transcribe audio and extract key points from spoken memories
// Uses Claude to structure raw thoughts into organized memory content

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, deceasedName, relationship } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo mode - return structured mock response
      return NextResponse.json({
        success: true,
        demo: true,
        summary: "A heartfelt memory about " + (deceasedName || "your loved one"),
        keyPoints: [
          { theme: "Personality", content: "They were warm and caring" },
          { theme: "Memory", content: "A special moment you shared together" },
          { theme: "Legacy", content: "What they meant to you" },
        ],
        suggestedTitle: "A Cherished Memory",
        formattedMemory: transcript,
        rawTranscript: transcript,
      });
    }

    // Use Claude to extract key points and structure the memory
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping someone preserve a memory of their ${relationship || "loved one"}${deceasedName ? ` named ${deceasedName}` : ""}.

They just spoke their thoughts about this person. Please analyze their words and help structure their memory.

Here's what they said:
"${transcript}"

Please respond in JSON format with:
{
  "summary": "A one-sentence summary of the core memory/feeling",
  "keyPoints": [
    { "theme": "Category like 'Personality', 'Shared Memory', 'Life Lesson', 'Funny Moment', etc.", "content": "The specific point" }
  ],
  "suggestedTitle": "A short, meaningful title for this memory",
  "formattedMemory": "The transcript cleaned up and formatted nicely as a written memory (keep their voice and words, just polish grammar and flow)",
  "questions": ["Optional follow-up questions to capture more detail"],
  "emotionalTone": "The overall emotional tone (warm, bittersweet, joyful, reflective, etc.)"
}

Extract 3-5 key points. Keep their authentic voice. Be gentle and respectful of their emotions.`,
        },
      ],
    });

    // Parse Claude's response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No response from Claude");
    }

    // Extract JSON
    let analysis;
    try {
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       textContent.text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
      analysis = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, create structured response from text
      analysis = {
        summary: "A memory shared with love",
        keyPoints: [{ theme: "Memory", content: transcript }],
        formattedMemory: transcript,
        suggestedTitle: "A Cherished Memory",
      };
    }

    return NextResponse.json({
      success: true,
      ...analysis,
      rawTranscript: transcript,
    });
  } catch (error) {
    console.error("Transcription analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze memory" },
      { status: 500 }
    );
  }
}
