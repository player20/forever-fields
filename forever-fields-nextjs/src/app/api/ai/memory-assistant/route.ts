import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/server";

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

// Helper function for demo mode
function generateMockAssistance(
  name: string,
  relationship: string | undefined,
  draft: string,
  type: string
): string {
  const relationshipStr = relationship ? `your ${relationship}` : name;

  const responses: Record<string, string> = {
    expand: `Here's an expanded version of your memory about ${name}:

"${draft}"

The warmth of that moment still lingers. I can almost feel the gentle presence of ${relationshipStr}, the way they made everyone feel seen and valued. There was something magical about how they could turn ordinary moments into treasured memories. The love that flowed so naturally from them created a safe haven where joy and laughter were always welcome guests.

Every detail you've shared paints a vivid picture of someone who touched lives deeply. The specific moments you remember - those are the threads that weave together the tapestry of their legacy.`,

    polish: `Here's a polished version of your memory:

"${draft.charAt(0).toUpperCase() + draft.slice(1)}"

I've kept your authentic voice while smoothing the flow. Your memory of ${relationshipStr} shines through beautifully. The essence of what you wanted to express - that deep connection and love - comes through clearly and touchingly.

Your words capture something real and precious. Sometimes the simplest expressions of love are the most powerful.`,

    suggest: `These are beautiful beginnings of your memories of ${name}. Here are some prompts that might help you remember more:

• What was their favorite way to spend a Sunday morning or evening?
• Can you recall a time they made you laugh unexpectedly?
• What advice did they give that you still think about today?
• What small gesture of theirs showed their love - something others might not have noticed?
• What would they say if they could see you now?
• What song, smell, or taste reminds you most of them?

Take your time with these. Sometimes the most meaningful memories surface when we least expect them.`,

    comfort: `What you've written about ${name} is truly meaningful:

"${draft}"

Grief can make writing feel impossible sometimes, and yet here you are, preserving precious memories. That takes courage.

Your words capture something real and important. There's no "right" way to write about someone we love - your authentic voice, your memories, your perspective - these are what make this tribute meaningful.

Take your time. It's okay to pause and come back. It's okay if tears fall on the keyboard. ${name}'s memory deserves to be honored at whatever pace feels right to you. What you're doing - keeping their memory alive - is a beautiful act of love.`,
  };

  return responses[type] || responses.comfort;
}

interface RequestBody {
  deceasedName: string;
  relationship?: string;
  memoryDraft: string;
  assistanceType: "expand" | "polish" | "suggest" | "comfort";
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as RequestBody;
    const { deceasedName, relationship, memoryDraft, assistanceType } = body;

    // Validate required fields
    if (!deceasedName || !memoryDraft || !assistanceType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Demo mode - return mock response without calling Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      const demoResponse = generateMockAssistance(
        deceasedName,
        relationship,
        memoryDraft,
        assistanceType
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const words = demoResponse.split(" ");
          for (const word of words) {
            await new Promise((resolve) => setTimeout(resolve, 25));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
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
