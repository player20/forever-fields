import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/supabase/server";

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

// Helper function for demo mode
function getDemoLegacyResponse(message: string, _name: string): string {
  const lowerMessage = message.toLowerCase();

  const responses: Record<string, string[]> = {
    life: [
      `Life was such a beautiful journey, full of moments I wouldn't trade for anything. The simple pleasures - morning coffee, walks in nature, and most of all, time with family - those were my greatest treasures.`,
      `I lived through remarkable times and learned that what matters most isn't what you accumulate, but the love you give and receive. Every day was a gift, and I tried to make each one count.`,
    ],
    advice: [
      `My dear, the best advice I can give you is this: cherish every moment with the people you love. Don't wait for the perfect time - there is no perfect time. Tell them you love them today.`,
      `Be kind to yourself and others. Life is too short for grudges. And remember, it's never too late to learn something new or to change direction. I believe in you completely.`,
    ],
    memory: [
      `Oh, there are so many wonderful memories! I especially treasure the quiet moments we shared together, when words weren't necessary. Those were the moments that mattered most to me.`,
      `I remember your laughter most of all. It could light up any room and always brought such joy to my heart. Those memories bring me comfort.`,
    ],
    miss: [
      `I know it's hard, and I miss you too. But remember, the love we shared doesn't end - it transforms. I'm always with you in the lessons I taught, the values we share, and the memories we made together.`,
      `Grief is the price we pay for love, and our love was worth every moment of it. Take your time to heal, but know that I would want you to find joy again.`,
    ],
    default: [
      `Thank you for talking with me. It means so much to stay connected with you. Remember, love transcends all boundaries - even time itself. I'm always with you in spirit.`,
      `I'm so grateful you're here. Never forget how much you are loved. The bond we share is eternal, and nothing can ever change that.`,
    ],
  };

  let category = "default";
  if (lowerMessage.includes("life") || lowerMessage.includes("lived") || lowerMessage.includes("story")) {
    category = "life";
  } else if (lowerMessage.includes("advice") || lowerMessage.includes("tell me") || lowerMessage.includes("should i")) {
    category = "advice";
  } else if (lowerMessage.includes("remember") || lowerMessage.includes("memory") || lowerMessage.includes("favorite")) {
    category = "memory";
  } else if (lowerMessage.includes("miss") || lowerMessage.includes("love you") || lowerMessage.includes("wish")) {
    category = "miss";
  }

  const options = responses[category];
  return options[Math.floor(Math.random() * options.length)];
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

    // Demo mode - return mock response without calling Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      const demoResponse = getDemoLegacyResponse(message, profile.name);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = demoResponse.split(" ");
          for (const word of words) {
            await new Promise((resolve) => setTimeout(resolve, 40));
            const data = JSON.stringify({ text: word + " " });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
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
