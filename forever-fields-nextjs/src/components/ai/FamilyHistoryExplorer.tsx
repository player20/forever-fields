"use client";

import { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

interface Ancestor {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  deathYear?: string;
  profilePhotoUrl?: string;
  biography?: string;
  hasLegacyData: boolean;
}

interface HistoricalContext {
  year: number;
  event: string;
  personalConnection?: string;
}

interface FamilyHistoryExplorerProps {
  ancestors: Ancestor[];
  currentUserId?: string;
}

// Historical events to contextualize lives
const HISTORICAL_EVENTS: HistoricalContext[] = [
  { year: 1914, event: "World War I begins" },
  { year: 1929, event: "The Great Depression begins" },
  { year: 1941, event: "United States enters World War II" },
  { year: 1945, event: "World War II ends" },
  { year: 1955, event: "Civil Rights Movement gains momentum" },
  { year: 1969, event: "Moon landing" },
  { year: 1989, event: "Fall of the Berlin Wall" },
  { year: 2001, event: "September 11 attacks" },
];

export function FamilyHistoryExplorer({ ancestors }: FamilyHistoryExplorerProps) {
  const [selectedAncestor, setSelectedAncestor] = useState<Ancestor | null>(null);
  const [explorationMode, setExplorationMode] = useState<"tree" | "timeline" | "stories" | "learn">("tree");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");

  const getLifeEvents = (ancestor: Ancestor): HistoricalContext[] => {
    if (!ancestor.birthYear || !ancestor.deathYear) return [];
    const birth = parseInt(ancestor.birthYear);
    const death = parseInt(ancestor.deathYear);
    return HISTORICAL_EVENTS.filter((e) => e.year >= birth && e.year <= death);
  };

  const generateAIInsight = async (ancestor: Ancestor, topic: string) => {
    setIsLoadingAI(true);
    setAiInsight("");

    try {
      const response = await fetch("/api/ai/memory-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deceasedName: ancestor.name,
          memoryDraft: ancestor.biography || "",
          assistanceType: "suggest",
          additionalContext: `Generate an educational insight about ${ancestor.name} for their descendant. Topic: ${topic}.
          They lived from ${ancestor.birthYear || "unknown"} to ${ancestor.deathYear || "unknown"}.
          Help the descendant understand what life was like for their ancestor and connect with their heritage.`,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate insight");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              text += data.text;
              setAiInsight(text);
            } catch {
              // Skip
            }
          }
        }
      }
    } catch (error) {
      console.error("AI insight error:", error);
      setAiInsight("Unable to generate insight. Please try again.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            Explore Your Family History
          </CardTitle>
          <CardDescription>
            Discover the stories, struggles, and triumphs of those who came before you.
            Their legacy lives in you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["tree", "timeline", "stories", "learn"] as const).map((mode) => (
              <Button
                key={mode}
                variant={explorationMode === mode ? "primary" : "outline"}
                onClick={() => setExplorationMode(mode)}
              >
                {mode === "tree" && "Family Tree"}
                {mode === "timeline" && "Timeline"}
                {mode === "stories" && "Stories"}
                {mode === "learn" && "Learn About Them"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ancestor List */}
        <div className="space-y-3">
          <h3 className="font-display text-lg text-sage-dark">Your Ancestors</h3>
          {ancestors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No ancestors have been added yet.
              </CardContent>
            </Card>
          ) : (
            ancestors.map((ancestor) => (
              <Card
                key={ancestor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedAncestor?.id === ancestor.id ? "ring-2 ring-sage" : ""
                }`}
                onClick={() => setSelectedAncestor(ancestor)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-sage-pale flex-shrink-0">
                      {ancestor.profilePhotoUrl ? (
                        <img
                          src={ancestor.profilePhotoUrl}
                          alt={ancestor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sage-dark font-display">
                          {ancestor.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sage-dark">{ancestor.name}</p>
                      <p className="text-sm text-gray-500">{ancestor.relationship}</p>
                      {ancestor.birthYear && (
                        <p className="text-xs text-gray-400">
                          {ancestor.birthYear}–{ancestor.deathYear || "Present"}
                        </p>
                      )}
                    </div>
                    {ancestor.hasLegacyData && (
                      <span className="ml-auto text-sage text-sm">✨ Stories</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          {!selectedAncestor ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-gray-500 mb-4">
                  Select an ancestor to explore their story
                </p>
                <p className="text-sm text-gray-400">
                  Every person in your family tree has a story worth knowing
                </p>
              </CardContent>
            </Card>
          ) : explorationMode === "tree" ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedAncestor.name}</CardTitle>
                <CardDescription>{selectedAncestor.relationship}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAncestor.profilePhotoUrl && (
                  <img
                    src={selectedAncestor.profilePhotoUrl}
                    alt={selectedAncestor.name}
                    className="w-48 h-48 object-cover rounded-lg mx-auto"
                  />
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Born:</span>
                    <span className="ml-2 text-sage-dark">
                      {selectedAncestor.birthYear || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Passed:</span>
                    <span className="ml-2 text-sage-dark">
                      {selectedAncestor.deathYear || "Unknown"}
                    </span>
                  </div>
                </div>
                {selectedAncestor.biography && (
                  <p className="text-gray-700">{selectedAncestor.biography}</p>
                )}
              </CardContent>
            </Card>
          ) : explorationMode === "timeline" ? (
            <Card>
              <CardHeader>
                <CardTitle>Life Timeline: {selectedAncestor.name}</CardTitle>
                <CardDescription>
                  Historical events during their lifetime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-sage-light pl-6 space-y-6">
                  {selectedAncestor.birthYear && (
                    <div className="relative">
                      <div className="absolute -left-8 w-4 h-4 rounded-full bg-sage border-2 border-cream" />
                      <p className="text-sage font-medium">{selectedAncestor.birthYear}</p>
                      <p className="text-sage-dark">{selectedAncestor.name} was born</p>
                    </div>
                  )}

                  {getLifeEvents(selectedAncestor).map((event) => (
                    <div key={event.year} className="relative">
                      <div className="absolute -left-8 w-4 h-4 rounded-full bg-gray-300 border-2 border-cream" />
                      <p className="text-gray-500 font-medium">{event.year}</p>
                      <p className="text-gray-700">{event.event}</p>
                      {event.personalConnection && (
                        <p className="text-sm text-sage italic mt-1">
                          {event.personalConnection}
                        </p>
                      )}
                    </div>
                  ))}

                  {selectedAncestor.deathYear && (
                    <div className="relative">
                      <div className="absolute -left-8 w-4 h-4 rounded-full bg-twilight border-2 border-cream" />
                      <p className="text-twilight font-medium">{selectedAncestor.deathYear}</p>
                      <p className="text-sage-dark">{selectedAncestor.name} passed away</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : explorationMode === "learn" ? (
            <Card>
              <CardHeader>
                <CardTitle>Learn About {selectedAncestor.name}</CardTitle>
                <CardDescription>
                  AI-powered insights to help you understand your ancestor's life
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => generateAIInsight(selectedAncestor, "What was daily life like for them?")}
                    disabled={isLoadingAI}
                  >
                    Daily Life
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateAIInsight(selectedAncestor, "What historical events shaped their life?")}
                    disabled={isLoadingAI}
                  >
                    Historical Context
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateAIInsight(selectedAncestor, "What challenges did their generation face?")}
                    disabled={isLoadingAI}
                  >
                    Challenges They Faced
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateAIInsight(selectedAncestor, "What can I learn from their life?")}
                    disabled={isLoadingAI}
                  >
                    Lessons for Today
                  </Button>
                </div>

                {(isLoadingAI || aiInsight) && (
                  <div className="bg-sage-pale/50 rounded-lg p-4 mt-4">
                    {isLoadingAI && !aiInsight ? (
                      <div className="flex items-center gap-2 text-sage">
                        <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                        <span>Generating insight...</span>
                      </div>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">{aiInsight}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Stories About {selectedAncestor.name}</CardTitle>
                <CardDescription>
                  Memories and stories shared by family members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAncestor.hasLegacyData ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 italic">
                      "They lived through so much but never lost their sense of humor..."
                    </p>
                    <Button>Read All Stories</Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      No stories have been shared yet about {selectedAncestor.name}
                    </p>
                    <Button>Be the First to Share</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
