"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MemoryAssistantProps {
  deceasedName: string;
  relationship?: string;
  initialDraft?: string;
  onSave?: (content: string) => void;
  className?: string;
}

type AssistanceType = "expand" | "polish" | "suggest" | "comfort";

const ASSISTANCE_OPTIONS: {
  type: AssistanceType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: "expand",
    label: "Expand",
    description: "Add details and depth",
    icon: "✨",
  },
  {
    type: "polish",
    label: "Polish",
    description: "Improve flow and clarity",
    icon: "💎",
  },
  {
    type: "suggest",
    label: "Suggest",
    description: "Get writing prompts",
    icon: "💡",
  },
  {
    type: "comfort",
    label: "Comfort",
    description: "Gentle encouragement",
    icon: "🤗",
  },
];

export function MemoryAssistant({
  deceasedName,
  relationship,
  initialDraft = "",
  onSave,
  className,
}: MemoryAssistantProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AssistanceType | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const requestAssistance = useCallback(
    async (type: AssistanceType) => {
      if (!draft.trim()) {
        setError("Please write something first");
        return;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsStreaming(true);
      setError(null);
      setAiResponse("");
      setSelectedType(type);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/memory-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deceasedName,
            relationship,
            memoryDraft: draft,
            assistanceType: type,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to get assistance");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setAiResponse((prev) => prev + parsed.text);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled
          return;
        }
        setError("Something went wrong. Please try again.");
        console.error("Memory Assistant error:", err);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [draft, deceasedName, relationship]
  );

  const handleUseResponse = () => {
    setDraft(aiResponse);
    setAiResponse("");
    setSelectedType(null);
  };

  const handleAppendResponse = () => {
    setDraft((prev) => prev + "\n\n" + aiResponse);
    setAiResponse("");
    setSelectedType(null);
  };

  const handleSave = () => {
    if (onSave && draft.trim()) {
      onSave(draft);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  return (
    <Card className={cn("max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">✍️</span>
          Memory Assistant
        </CardTitle>
        <CardDescription>
          Write about {deceasedName}
          {relationship && ` (your ${relationship})`}. Our AI assistant can help
          you find the right words.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Draft textarea */}
        <div>
          <Textarea
            label="Your memory"
            placeholder={`Share a memory of ${deceasedName}... What made them special? What do you want people to remember about them?`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[150px]"
            disabled={isStreaming}
          />
          <p className="mt-1 text-sm text-gray-body">
            {draft.length} characters
          </p>
        </div>

        {/* Assistance buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-dark">
            Need help writing?
          </p>
          <div className="flex flex-wrap gap-2">
            {ASSISTANCE_OPTIONS.map((option) => (
              <Button
                key={option.type}
                variant={selectedType === option.type ? "primary" : "outline"}
                size="sm"
                onClick={() => requestAssistance(option.type)}
                disabled={isStreaming || !draft.trim()}
                className="flex items-center gap-1"
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-body">
            {ASSISTANCE_OPTIONS.find((o) => o.type === selectedType)
              ?.description || "Select an option above for AI assistance"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* AI Response */}
        {(aiResponse || isStreaming) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-dark">
                AI Suggestion
              </p>
              {isStreaming && (
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="p-4 bg-sage-pale rounded-lg border border-sage-light">
              <p className="text-gray-dark whitespace-pre-wrap">
                {aiResponse}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-sage animate-pulse ml-1" />
                )}
              </p>
            </div>

            {/* Action buttons for AI response */}
            {aiResponse && !isStreaming && (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUseResponse}
                >
                  Use this
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAppendResponse}
                >
                  Add to draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAiResponse("");
                    setSelectedType(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {onSave && (
          <div className="pt-4 border-t border-gray-light/50">
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={!draft.trim() || isStreaming}
              className="w-full"
            >
              Save Memory
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
