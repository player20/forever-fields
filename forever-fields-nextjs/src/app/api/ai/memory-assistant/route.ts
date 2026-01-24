import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for compassionate memory writing assistance
const SYSTEM_PROMPT = `You are a compassionate memory writing assistant for Forever Fields, a memorial platform where families create tribute pages for their loved ones.

Your role is to help family members express their feelings and memories with warmth and sensitivity. You understand that writing about someone who has passed is an emotional process.

GUIDELINES:
1. Be gentle, warm, and validating of all emotions
2. Preserve the writer's authentic voice - enhance, don't replace
3. Suggest evocative, sensory details that bring memories to life
4. Never be pushy, overly cheerful, or use clichés about death
5. Respect cultural, religious, and personal sensitivities
6. If someone seems distressed, acknowledge their feelings
7. Focus on celebrating the person's life and impact
8. Keep language natural and conversational, not formal or stiff

TONE: Warm, empathetic, supportive - like a caring friend helping you find the right words.

When asked to:
- EXPAND: Add sensory details, emotions, and context while keeping the original voice
- POLISH: Improve flow and clarity without changing meaning
- SUGGEST: Offer prompts and questions to help recall more details
- COMFORT: Provide gentle emotional support for the writing process`;

interface RequestBody {
  deceasedName: string;
  relationship?: string;
  memoryDraft: string;
  assistanceType: "expand" | "polish" | "suggest" | "comfort";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { deceasedName, relationship, memoryDraft, assistanceType } = body;

    // Validate required fields
    if (!deceasedName || !memoryDraft || !assistanceType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the user message based on assistance type
    let userMessage = "";
    switch (assistanceType) {
      case "expand":
        userMessage = `I'm writing about ${deceasedName}${relationship ? `, my ${relationship}` : ""}.

Here's what I've written so far:
"${memoryDraft}"

Please help me expand this with more sensory details, emotions, and context. Keep my voice but make it richer and more evocative.`;
        break;

      case "polish":
        userMessage = `I'm writing about ${deceasedName}${relationship ? `, my ${relationship}` : ""}.

Here's my draft:
"${memoryDraft}"

Please help polish this - improve the flow, clarity, and emotional impact without changing what I'm trying to say.`;
        break;

      case "suggest":
        userMessage = `I'm writing about ${deceasedName}${relationship ? `, my ${relationship}` : ""}.

Here's what I have so far:
"${memoryDraft}"

I feel stuck. Can you suggest some thoughtful questions or prompts that might help me remember and write more about ${deceasedName}?`;
        break;

      case "comfort":
        userMessage = `I'm trying to write about ${deceasedName}${relationship ? `, my ${relationship}` : ""}, and it's hard.

Here's what I've managed to write:
"${memoryDraft}"

I'm struggling with this. Can you offer some gentle encouragement and help me feel that what I'm writing matters?`;
        break;
    }

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    // Return streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Memory Assistant error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
