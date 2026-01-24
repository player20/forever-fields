import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Scan recipe cards/photos and extract structured recipe data
// Uses Claude Vision to read handwritten or printed recipes

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, familyName } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo mode - return mock scanned recipe
      return NextResponse.json({
        success: true,
        demo: true,
        title: "Scanned Family Recipe",
        description: "A treasured recipe from the " + (familyName || "family") + " collection",
        ingredients: [
          "2 cups flour",
          "1 cup sugar",
          "3 eggs",
          "1 cup butter, softened",
          "1 tsp vanilla extract",
          "1/2 tsp salt",
        ],
        instructions: [
          "Preheat oven to 350°F",
          "Mix dry ingredients in a large bowl",
          "Cream butter and sugar until fluffy",
          "Add eggs one at a time, then vanilla",
          "Gradually add dry ingredients",
          "Bake for 25-30 minutes until golden",
        ],
        category: "dessert",
        servings: "12 servings",
        prepTime: "15 min",
        cookTime: "30 min",
        confidence: 0.85,
        notes: "Recipe appears to be handwritten, likely from mid-20th century based on style",
      });
    }

    // Extract base64 data and media type
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const mediaType = base64Match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const base64Data = base64Match[2];

    // Use Claude Vision to analyze the recipe card
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `You are helping a family digitize their treasured recipe collection${familyName ? ` for the ${familyName} family` : ""}.

Please analyze this recipe image (it may be handwritten, typed, or printed) and extract all the information you can find.

Respond in JSON format:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount", ...],
  "instructions": ["step 1", "step 2", ...],
  "category": "one of: appetizer, main, side, dessert, drink, bread, soup, salad, other",
  "servings": "number of servings if mentioned",
  "prepTime": "prep time if mentioned",
  "cookTime": "cook time if mentioned",
  "notes": "any additional notes, tips, or observations about the recipe card itself (age, condition, handwriting style)",
  "confidence": 0.0-1.0 (how confident you are in your reading)
}

Important:
- If text is hard to read, make your best interpretation and note it
- Preserve original measurements (don't convert)
- If instructions are numbered, maintain the order
- Note any special tips or variations mentioned
- If you can estimate the era of the recipe card, mention it in notes`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No response from Claude");
    }

    // Extract JSON
    let recipeData;
    try {
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       textContent.text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
      recipeData = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return a basic structure
      return NextResponse.json({
        success: false,
        error: "Could not parse recipe from image",
        rawResponse: textContent.text,
      });
    }

    return NextResponse.json({
      success: true,
      ...recipeData,
    });
  } catch (error) {
    console.error("Recipe scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan recipe" },
      { status: 500 }
    );
  }
}
