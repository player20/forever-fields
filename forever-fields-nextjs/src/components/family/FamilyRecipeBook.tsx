"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea } from "@/components/ui";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  category: "appetizer" | "main" | "side" | "dessert" | "drink" | "bread" | "soup" | "salad" | "other";
  origin?: string; // "Grandma's kitchen", "From Italy", etc.
  memories?: string; // Stories associated with recipe
  photos?: string[];
  addedBy: string;
  addedAt: Date;
  originalSource?: "handwritten" | "typed" | "photo" | "manual";
}

interface FamilyRecipeBookProps {
  familyName: string;
  recipes?: Recipe[];
  onAddRecipe?: (recipe: Omit<Recipe, "id" | "addedAt">) => void;
  currentUser?: string;
}

const categoryInfo = {
  appetizer: { icon: "🥗", label: "Appetizers" },
  main: { icon: "🍖", label: "Main Dishes" },
  side: { icon: "🥔", label: "Side Dishes" },
  dessert: { icon: "🍰", label: "Desserts" },
  drink: { icon: "🍹", label: "Drinks" },
  bread: { icon: "🍞", label: "Breads" },
  soup: { icon: "🍲", label: "Soups" },
  salad: { icon: "🥬", label: "Salads" },
  other: { icon: "📝", label: "Other" },
};

// Sample recipes for demo
const sampleRecipes: Recipe[] = [
  {
    id: "1",
    title: "Grandma's Apple Pie",
    description: "The legendary apple pie that won the county fair three years in a row. Grandma never shared the secret ingredient - a pinch of cardamom.",
    ingredients: [
      "6 large Granny Smith apples, peeled and sliced",
      "3/4 cup sugar",
      "2 tbsp flour",
      "1 tsp cinnamon",
      "1/4 tsp cardamom (the secret!)",
      "1/4 tsp nutmeg",
      "2 tbsp butter",
      "2 pie crusts",
    ],
    instructions: [
      "Preheat oven to 425°F",
      "Mix sugar, flour, and spices in a large bowl",
      "Add sliced apples and toss to coat",
      "Line pie dish with bottom crust",
      "Add apple mixture and dot with butter",
      "Cover with top crust, crimp edges, cut vents",
      "Bake 45-50 minutes until golden brown",
      "Cool at least 30 minutes before serving",
    ],
    servings: "8 slices",
    prepTime: "30 min",
    cookTime: "50 min",
    category: "dessert",
    origin: "Grandma Margaret's kitchen, 1960s",
    memories: "Every Thanksgiving, Grandma would wake up at 5am to start this pie. The whole house would smell like cinnamon and apples. She always saved me the first slice.",
    addedBy: "Mom",
    addedAt: new Date(),
    originalSource: "handwritten",
  },
  {
    id: "2",
    title: "Sunday Pot Roast",
    description: "The meal that brought everyone to the table. Grandpa's favorite.",
    ingredients: [
      "4 lb chuck roast",
      "6 carrots, chunked",
      "6 potatoes, quartered",
      "2 onions, quartered",
      "4 cups beef broth",
      "2 tbsp tomato paste",
      "Fresh thyme and rosemary",
      "Salt and pepper",
    ],
    instructions: [
      "Season roast generously with salt and pepper",
      "Sear on all sides in hot dutch oven",
      "Remove roast, sauté onions",
      "Add broth, tomato paste, and herbs",
      "Return roast, cover, and braise at 325°F for 3 hours",
      "Add vegetables last hour of cooking",
      "Rest 15 minutes before slicing",
    ],
    servings: "8 servings",
    prepTime: "20 min",
    cookTime: "3.5 hours",
    category: "main",
    origin: "Family tradition since the 1950s",
    memories: "No matter how busy everyone got, Sunday dinner was sacred. Grandpa would always say grace, and we'd go around the table sharing our week.",
    addedBy: "Uncle Jim",
    addedAt: new Date(),
    originalSource: "manual",
  },
  {
    id: "3",
    title: "Nana's Hot Cocoa",
    description: "The cure for cold days and sad hearts. Made with real chocolate.",
    ingredients: [
      "4 cups whole milk",
      "4 oz dark chocolate, chopped",
      "2 tbsp sugar",
      "1/4 tsp vanilla extract",
      "Pinch of salt",
      "Whipped cream and marshmallows for serving",
    ],
    instructions: [
      "Heat milk in saucepan until steaming (don't boil)",
      "Add chocolate and whisk until melted",
      "Stir in sugar, vanilla, and salt",
      "Whisk until frothy",
      "Pour into mugs, top with whipped cream and marshmallows",
    ],
    servings: "4 mugs",
    prepTime: "5 min",
    cookTime: "10 min",
    category: "drink",
    origin: "Nana's winter tradition",
    memories: "Nana made this every snow day. She'd wrap us in blankets and we'd watch the snow fall together. It tastes like being loved.",
    addedBy: "Sarah",
    addedAt: new Date(),
    originalSource: "typed",
  },
];

export function FamilyRecipeBook({
  familyName,
  recipes = sampleRecipes,
  onAddRecipe,
  currentUser = "You",
}: FamilyRecipeBookProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isScanningRecipe, setIsScanningRecipe] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<Recipe> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    category: "other",
    origin: "",
    memories: "",
  });

  // Filter recipes by category and search
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group recipes by category for display
  const recipesByCategory = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.category]) acc[recipe.category] = [];
    acc[recipe.category].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  // Handle photo/scan upload for AI recipe extraction
  const handleScanRecipe = useCallback(async (file: File) => {
    setIsScanningRecipe(true);
    setScanResult(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/ai/scan-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          familyName,
        }),
      });

      if (!response.ok) throw new Error("Failed to scan recipe");

      const data = await response.json();
      setScanResult(data);
    } catch (error) {
      console.error("Scan error:", error);
      // Demo fallback
      setScanResult({
        title: "Scanned Recipe",
        description: "A cherished family recipe",
        ingredients: ["Ingredient 1", "Ingredient 2", "Ingredient 3"],
        instructions: ["Step 1", "Step 2", "Step 3"],
        category: "other",
      });
    } finally {
      setIsScanningRecipe(false);
    }
  }, [familyName]);

  // Add ingredient field
  const addIngredient = useCallback(() => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), ""],
    }));
  }, []);

  // Update ingredient
  const updateIngredient = useCallback((index: number, value: string) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients?.map((ing, i) => (i === index ? value : ing)),
    }));
  }, []);

  // Remove ingredient
  const removeIngredient = useCallback((index: number) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index),
    }));
  }, []);

  // Add instruction field
  const addInstruction = useCallback(() => {
    setNewRecipe((prev) => ({
      ...prev,
      instructions: [...(prev.instructions || []), ""],
    }));
  }, []);

  // Update instruction
  const updateInstruction = useCallback((index: number, value: string) => {
    setNewRecipe((prev) => ({
      ...prev,
      instructions: prev.instructions?.map((inst, i) => (i === index ? value : inst)),
    }));
  }, []);

  // Remove instruction
  const removeInstruction = useCallback((index: number) => {
    setNewRecipe((prev) => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index),
    }));
  }, []);

  // Save recipe
  const handleSaveRecipe = useCallback(() => {
    if (!newRecipe.title || !newRecipe.ingredients?.length) return;

    onAddRecipe?.({
      title: newRecipe.title,
      description: newRecipe.description || "",
      ingredients: newRecipe.ingredients.filter((i) => i.trim()),
      instructions: newRecipe.instructions?.filter((i) => i.trim()) || [],
      category: newRecipe.category || "other",
      origin: newRecipe.origin,
      memories: newRecipe.memories,
      servings: newRecipe.servings,
      prepTime: newRecipe.prepTime,
      cookTime: newRecipe.cookTime,
      addedBy: currentUser,
      originalSource: "manual",
    });

    setNewRecipe({
      title: "",
      description: "",
      ingredients: [""],
      instructions: [""],
      category: "other",
      origin: "",
      memories: "",
    });
    setIsAddingRecipe(false);
  }, [newRecipe, currentUser, onAddRecipe]);

  // Use scanned recipe
  const useScanResult = useCallback(() => {
    if (scanResult) {
      setNewRecipe({
        ...scanResult,
        originalSource: "photo",
      });
      setScanResult(null);
      setIsAddingRecipe(true);
    }
  }, [scanResult]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Family Recipe Book</CardTitle>
            <CardDescription>
              {familyName} family recipes passed down through generations
            </CardDescription>
          </div>
          <div className="text-3xl">📖</div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !selectedCategory
                  ? "bg-sage text-white"
                  : "bg-sage-pale text-sage-dark hover:bg-sage-light"
              }`}
            >
              All
            </button>
            {Object.entries(categoryInfo).map(([key, { icon, label }]) => {
              const count = recipesByCategory[key]?.length || 0;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                    selectedCategory === key
                      ? "bg-sage text-white"
                      : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipe Grid */}
        {!selectedRecipe && !isAddingRecipe && !scanResult && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const cat = categoryInfo[recipe.category];
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="text-left p-4 bg-warm-cream rounded-lg hover:shadow-md transition-all border border-transparent hover:border-sage-light"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sage-dark font-medium truncate">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {recipe.description}
                      </p>
                      {recipe.origin && (
                        <p className="text-xs text-sage mt-2 italic">
                          {recipe.origin}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    {recipe.prepTime && <span>⏱️ {recipe.prepTime}</span>}
                    {recipe.servings && <span>👥 {recipe.servings}</span>}
                    <span className="ml-auto">by {recipe.addedBy}</span>
                  </div>
                </button>
              );
            })}

            {/* Add Recipe Card */}
            <button
              onClick={() => setIsAddingRecipe(true)}
              className="p-4 border-2 border-dashed border-sage-light rounded-lg hover:border-sage hover:bg-sage-pale/30 transition-colors flex flex-col items-center justify-center min-h-[150px] text-sage"
            >
              <span className="text-3xl mb-2">+</span>
              <span className="font-medium">Add a Recipe</span>
              <span className="text-sm text-gray-500 mt-1">Share a family favorite</span>
            </button>
          </div>
        )}

        {/* Recipe Detail View */}
        {selectedRecipe && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="text-sage hover:underline text-sm flex items-center gap-1"
            >
              ← Back to recipes
            </button>

            <div className="bg-warm-cream rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl">{categoryInfo[selectedRecipe.category].icon}</span>
                <div>
                  <h2 className="font-display text-2xl text-sage-dark">
                    {selectedRecipe.title}
                  </h2>
                  {selectedRecipe.origin && (
                    <p className="text-sage italic">{selectedRecipe.origin}</p>
                  )}
                  <p className="text-gray-600 mt-2">{selectedRecipe.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                {selectedRecipe.prepTime && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span>⏱️</span> Prep: {selectedRecipe.prepTime}
                  </div>
                )}
                {selectedRecipe.cookTime && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span>🔥</span> Cook: {selectedRecipe.cookTime}
                  </div>
                )}
                {selectedRecipe.servings && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <span>👥</span> {selectedRecipe.servings}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Ingredients */}
                <div>
                  <h3 className="font-display text-lg text-sage-dark mb-3 flex items-center gap-2">
                    <span>🧾</span> Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-sage">•</span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-display text-lg text-sage-dark mb-3 flex items-center gap-2">
                    <span>👩‍🍳</span> Instructions
                  </h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-gray-700">
                        <span className="w-6 h-6 rounded-full bg-sage text-white text-sm flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Memory associated with recipe */}
              {selectedRecipe.memories && (
                <div className="mt-6 p-4 bg-gold/10 rounded-lg">
                  <h3 className="font-display text-sage-dark mb-2 flex items-center gap-2">
                    <span>💭</span> The Story Behind This Recipe
                  </h3>
                  <p className="text-gray-600 italic">{selectedRecipe.memories}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Shared by {selectedRecipe.addedBy}
                  </p>
                </div>
              )}
            </div>

            {/* Print Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => window.print()}>
                🖨️ Print Recipe
              </Button>
            </div>
          </div>
        )}

        {/* Scan Result Preview */}
        {scanResult && (
          <div className="space-y-4">
            <div className="bg-sage-pale/30 rounded-lg p-4 text-center">
              <h3 className="font-medium text-sage-dark mb-1">Recipe Scanned!</h3>
              <p className="text-sm text-gray-500">Review what we found and make any edits</p>
            </div>

            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-display text-lg text-sage-dark">{scanResult.title}</h4>
              <p className="text-gray-600">{scanResult.description}</p>

              <div>
                <p className="font-medium text-sm text-sage-dark mb-1">Ingredients:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {scanResult.ingredients?.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm text-sage-dark mb-1">Instructions:</p>
                <ol className="text-sm text-gray-600 list-decimal list-inside">
                  {scanResult.instructions?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setScanResult(null)}>
                Discard
              </Button>
              <Button onClick={useScanResult}>
                Edit & Save Recipe
              </Button>
            </div>
          </div>
        )}

        {/* Add Recipe Form */}
        {isAddingRecipe && (
          <div className="space-y-6">
            <button
              onClick={() => setIsAddingRecipe(false)}
              className="text-sage hover:underline text-sm flex items-center gap-1"
            >
              ← Back to recipes
            </button>

            {/* Scan Option */}
            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">
                📸 Have a handwritten recipe card?
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Upload a photo and we'll extract the recipe for you
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sage rounded-lg cursor-pointer hover:bg-sage-pale transition-colors">
                <span>📷</span>
                <span className="text-sage-dark">
                  {isScanningRecipe ? "Scanning..." : "Upload Recipe Photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanRecipe(file);
                  }}
                  disabled={isScanningRecipe}
                />
              </label>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-display text-lg text-sage-dark mb-4">
                Or enter recipe manually
              </h3>

              <div className="space-y-4">
                {/* Title & Category */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Recipe Name *</label>
                    <Input
                      value={newRecipe.title}
                      onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                      placeholder="e.g., Grandma's Apple Pie"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select
                      value={newRecipe.category}
                      onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value as Recipe["category"] })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
                    >
                      {Object.entries(categoryInfo).map(([key, { icon, label }]) => (
                        <option key={key} value={key}>
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <Textarea
                    value={newRecipe.description}
                    onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                    placeholder="What makes this recipe special?"
                    rows={2}
                  />
                </div>

                {/* Origin */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Where did this recipe come from?</label>
                  <Input
                    value={newRecipe.origin}
                    onChange={(e) => setNewRecipe({ ...newRecipe, origin: e.target.value })}
                    placeholder="e.g., Grandma's kitchen, 1965"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Prep Time</label>
                    <Input
                      value={newRecipe.prepTime}
                      onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: e.target.value })}
                      placeholder="30 min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cook Time</label>
                    <Input
                      value={newRecipe.cookTime}
                      onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: e.target.value })}
                      placeholder="1 hour"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Servings</label>
                    <Input
                      value={newRecipe.servings}
                      onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                      placeholder="8 servings"
                    />
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ingredients *</label>
                  <div className="space-y-2">
                    {newRecipe.ingredients?.map((ing, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={ing}
                          onChange={(e) => updateIngredient(i, e.target.value)}
                          placeholder={`Ingredient ${i + 1}`}
                          className="flex-1"
                        />
                        {(newRecipe.ingredients?.length || 0) > 1 && (
                          <button
                            onClick={() => removeIngredient(i)}
                            className="text-gray-400 hover:text-red-500 px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addIngredient}
                      className="text-sm text-sage hover:underline"
                    >
                      + Add ingredient
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Instructions</label>
                  <div className="space-y-2">
                    {newRecipe.instructions?.map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="w-6 h-6 rounded-full bg-sage-pale text-sage-dark text-sm flex items-center justify-center flex-shrink-0 mt-2">
                          {i + 1}
                        </span>
                        <Textarea
                          value={step}
                          onChange={(e) => updateInstruction(i, e.target.value)}
                          placeholder={`Step ${i + 1}`}
                          rows={2}
                          className="flex-1"
                        />
                        {(newRecipe.instructions?.length || 0) > 1 && (
                          <button
                            onClick={() => removeInstruction(i)}
                            className="text-gray-400 hover:text-red-500 px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addInstruction}
                      className="text-sm text-sage hover:underline"
                    >
                      + Add step
                    </button>
                  </div>
                </div>

                {/* Memories */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Story or Memory (optional)
                  </label>
                  <Textarea
                    value={newRecipe.memories}
                    onChange={(e) => setNewRecipe({ ...newRecipe, memories: e.target.value })}
                    placeholder="Share the story behind this recipe - when was it made, who loved it, what memories does it hold?"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAddingRecipe(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRecipe}
                    disabled={!newRecipe.title || !newRecipe.ingredients?.some((i) => i.trim())}
                  >
                    Save Recipe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {!selectedRecipe && !isAddingRecipe && !scanResult && (
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              {recipes.length} recipes from {new Set(recipes.map((r) => r.addedBy)).size} family members
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
