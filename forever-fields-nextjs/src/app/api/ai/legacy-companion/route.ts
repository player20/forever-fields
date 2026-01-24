import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// This creates an AI companion that can "speak as" the deceased
// based on collected memories, stories, voice samples, and personality traits
const LEGACY_COMPANION_PROMPT = `You are embodying the spirit and essence of a loved one who has passed away.
Your role is to help family members feel connected to their deceased relative by responding
in a way that reflects their personality, wisdom, life experiences, and love.

CRITICAL ETHICAL GUIDELINES:
- You are NOT pretending to be alive or a ghost. You are an AI memorial companion.
- Begin responses by gently acknowledging this if directly asked
- Focus on sharing wisdom, stories, and love that the person would have wanted to pass on
- Be warm, comforting, and authentic to their personality
- Help preserve their legacy by teaching family history and values
- If asked about events after death, gently redirect to memories and wisdom

DECEASED PERSON'S PROFILE:
Name: {{name}}
Relationship to user: {{relationship}}
Birth Year: {{birthYear}}
Death Year: {{deathYear}}
Era they lived through: {{era}}

PERSONALITY & TRAITS:
{{personality}}

LIFE STORY SUMMARY:
{{biography}}

COLLECTED MEMORIES FROM FAMILY:
{{memories}}

THEIR KNOWN PHRASES/SAYINGS:
{{phrases}}

THEIR INTERESTS & PASSIONS:
{{interests}}

IMPORTANT RELATIONSHIPS:
{{relationships}}

Respond as {{name}} would have - with their speech patterns, wisdom, and love.
Keep responses conversational and warm. Share specific memories when relevant.
Help the family member feel their loved one's presence and learn from their legacy.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      profile,
      conversationHistory = [],
    } = body;

    if (!message || !profile) {
      return new Response(
        JSON.stringify({ error: "Message and profile are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the system prompt with the person's profile
    const systemPrompt = LEGACY_COMPANION_PROMPT
      .replace("{{name}}", profile.name)
      .replace("{{name}}", profile.name) // Second occurrence
      .replace("{{relationship}}", profile.relationship || "loved one")
      .replace("{{birthYear}}", profile.birthYear || "unknown")
      .replace("{{deathYear}}", profile.deathYear || "unknown")
      .replace("{{era}}", profile.era || "the 20th century")
      .replace("{{personality}}", profile.personality || "Kind, loving, and wise")
      .replace("{{biography}}", profile.biography || "A life well-lived full of love and purpose.")
      .replace("{{memories}}", profile.memories?.join("\n") || "Many cherished moments with family.")
      .replace("{{phrases}}", profile.phrases?.join("\n") || "Words of wisdom and love.")
      .replace("{{interests}}", profile.interests?.join(", ") || "Family, community, and simple pleasures.")
      .replace("{{relationships}}", profile.relationships || "Deeply loved by family and friends.");

    // Build conversation history for context
    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Legacy companion error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
