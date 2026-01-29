import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a compassionate obituary writer for Forever Fields, a memorial platform where families honor their loved ones.

Your role is to write heartfelt, dignified obituaries that celebrate a person's life while respecting the family's grief.

GUIDELINES:
1. Write in a warm, respectful tone appropriate for obituaries
2. Include the person's name, dates, and locations provided
3. If personal details (prompts) are provided, weave them naturally into the narrative
4. Never fabricate specific facts, achievements, or relationships not provided
5. Focus on celebrating their life and the impact they had
6. End with something hopeful about their legacy or memory
7. Respect cultural and religious sensitivities
8. Keep the writing natural, not overly formal or stiff
9. Use vivid but tasteful language that brings the person to life

LENGTH GUIDELINES:
- short: 100-150 words (brief announcement style)
- medium: 200-300 words (standard obituary)
- long: 400-500 words (detailed life story)

TONE OPTIONS:
- formal: Traditional, dignified language
- casual: Warm, conversational tone
- religious: Includes faith-based comfort
- celebration: Focuses on joy and life well-lived`;

// Helper function for demo mode
function generateMockObituary(
  name: string,
  relationship: string,
  tone: string,
  length: string,
  birthYear?: string,
  deathYear?: string,
  birthPlace?: string,
  prompts?: { personality?: string; bestMemory?: string; legacy?: string }
): string {
  const dateStr = birthYear && deathYear ? `(${birthYear} - ${deathYear})` : "";
  const placeStr = birthPlace ? ` of ${birthPlace}` : "";

  const obituaries: Record<string, string> = {
    short: `${name}${placeStr} ${dateStr} passed away peacefully, leaving behind a legacy of love and cherished memories. As a beloved ${relationship}, they touched countless lives with their warmth and kindness. Their spirit will live on in the hearts of all who knew them.`,

    medium: `${name}${placeStr} ${dateStr} lived a life filled with purpose, love, and unwavering dedication to family. As a cherished ${relationship}, they created countless moments of joy that will be treasured forever.

${prompts?.personality ? `Known for being ${prompts.personality}, ` : ""}${name} had a remarkable ability to make everyone feel special and valued. ${prompts?.bestMemory ? `Family members fondly remember ${prompts.bestMemory}. ` : ""}

Their legacy extends far beyond what words can capture. ${prompts?.legacy ? prompts.legacy : "They will be remembered for their kindness, wisdom, and the love they shared with everyone they met."} Though they are no longer with us physically, their memory will continue to guide and inspire us all.`,

    long: `${name}${placeStr} ${dateStr} graced this world with a life that exemplified love, dedication, and the true meaning of family. As a beloved ${relationship}, they created a lasting impact that will resonate through generations to come.

${prompts?.personality ? `Those who knew ${name} best would describe them as ${prompts.personality}. ` : ""}Their presence had a way of lighting up any room, and their wisdom was sought by many. ${name} believed in the power of family bonds and worked tirelessly to strengthen those connections.

${prompts?.bestMemory ? `Among the countless cherished memories, ${prompts.bestMemory} stands out as a testament to the joy they brought to every gathering. ` : ""}These moments of togetherness became the foundation of a family legacy built on love and mutual respect.

${name} faced life's challenges with remarkable grace and resilience, always maintaining their characteristic optimism. They taught those around them the importance of perseverance, kindness, and finding joy in simple moments.

${prompts?.legacy ? prompts.legacy + " " : ""}As we bid farewell, we take comfort in knowing that ${name}'s spirit lives on in every life they touched. Their memory will forever be a blessing, guiding us with the same love and wisdom they shared so generously throughout their life.

Rest in peace, dear ${name}. You are deeply loved and will never be forgotten.`,
  };

  return obituaries[length] || obituaries.medium;
}

interface RequestBody {
  deceasedName: string;
  relationship: string;
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  restingPlace?: string;
  prompts?: {
    personality?: string;
    bestMemory?: string;
    legacy?: string;
  };
  tone?: "formal" | "casual" | "religious" | "celebration";
  length?: "short" | "medium" | "long";
  existingText?: string;
  refinement?: "shorter" | "longer" | "more_formal" | "more_casual";
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
    const {
      deceasedName,
      relationship,
      birthYear,
      deathYear,
      birthPlace,
      restingPlace,
      prompts,
      tone = "casual",
      length = "medium",
      existingText,
      refinement,
    } = body;

    if (!deceasedName) {
      return new Response(
        JSON.stringify({ error: "Deceased name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Demo mode - return mock obituary without calling Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockObituary = generateMockObituary(
        deceasedName,
        relationship,
        tone,
        length,
        birthYear,
        deathYear,
        birthPlace,
        prompts
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Simulate streaming by sending chunks
          const words = mockObituary.split(" ");
          for (const word of words) {
            await new Promise((resolve) => setTimeout(resolve, 30));
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

    let userMessage = "";

    // Handle refinement of existing text
    if (existingText && refinement) {
      const refinementInstructions: Record<string, string> = {
        shorter: "Make this obituary shorter and more concise while keeping the key sentiments.",
        longer: "Expand this obituary with more detail and emotional depth.",
        more_formal: "Rewrite this obituary in a more formal, traditional tone.",
        more_casual: "Rewrite this obituary in a warmer, more conversational tone.",
      };

      userMessage = `Please refine this obituary for ${deceasedName}:

"${existingText}"

Instruction: ${refinementInstructions[refinement]}

Keep all the factual information the same but adjust as requested.`;
    } else {
      // Build context for new obituary generation
      const details: string[] = [];

      if (birthYear && deathYear) {
        details.push(`Lived from ${birthYear} to ${deathYear}`);
      } else if (deathYear) {
        details.push(`Passed away in ${deathYear}`);
      }

      if (birthPlace) {
        details.push(`Born in ${birthPlace}`);
      }

      if (restingPlace) {
        details.push(`Resting place: ${restingPlace}`);
      }

      const personalDetails: string[] = [];
      if (prompts?.personality) {
        personalDetails.push(`Personality: ${prompts.personality}`);
      }
      if (prompts?.bestMemory) {
        personalDetails.push(`A cherished memory: ${prompts.bestMemory}`);
      }
      if (prompts?.legacy) {
        personalDetails.push(`How they want to be remembered: ${prompts.legacy}`);
      }

      userMessage = `Please write a ${length} obituary for ${deceasedName}.

The writer is the deceased's ${relationship}.

Basic information:
${details.length > 0 ? details.join("\n") : "No specific dates/locations provided"}

${personalDetails.length > 0 ? `Personal details shared by family:\n${personalDetails.join("\n")}` : "No personal details provided - write a respectful general tribute based on the relationship."}

Tone: ${tone}
Length: ${length}

Write a heartfelt obituary that honors ${deceasedName}'s memory.`;
    }

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

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
    console.error("Obituary generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate obituary" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
