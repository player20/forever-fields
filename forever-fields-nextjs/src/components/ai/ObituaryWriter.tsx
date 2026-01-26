"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { toast } from "sonner";
import {
  PenLine,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
} from "lucide-react";

type WritingMode = "manual" | "prompts" | "ai";
type Tone = "formal" | "casual" | "religious" | "celebration";
type Length = "short" | "medium" | "long";

interface ObituaryWriterProps {
  deceasedName: string;
  relationship: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  restingPlace?: string;
  initialValue?: string;
  onSave: (obituary: string) => void;
}

const writingModes = [
  {
    id: "manual" as WritingMode,
    icon: PenLine,
    title: "Write it myself",
    description: "I have my own words to share",
  },
  {
    id: "prompts" as WritingMode,
    icon: MessageSquare,
    title: "Help me with prompts",
    description: "Answer questions, AI combines them",
  },
  {
    id: "ai" as WritingMode,
    icon: Sparkles,
    title: "AI write for me",
    description: "Generate from the info provided",
  },
];

const toneOptions: { value: Tone; label: string }[] = [
  { value: "casual", label: "Warm & Conversational" },
  { value: "formal", label: "Traditional & Dignified" },
  { value: "religious", label: "Faith-Based Comfort" },
  { value: "celebration", label: "Celebration of Life" },
];

const lengthOptions: { value: Length; label: string; description: string }[] = [
  { value: "short", label: "Brief", description: "100-150 words" },
  { value: "medium", label: "Standard", description: "200-300 words" },
  { value: "long", label: "Detailed", description: "400-500 words" },
];

export function ObituaryWriter({
  deceasedName,
  relationship,
  birthDate,
  deathDate,
  birthPlace,
  restingPlace,
  initialValue = "",
  onSave,
}: ObituaryWriterProps) {
  const [mode, setMode] = useState<WritingMode | null>(null);
  const [obituary, setObituary] = useState(initialValue);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [tone, setTone] = useState<Tone>("casual");
  const [length, setLength] = useState<Length>("medium");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Prompt-based mode state
  const [prompts, setPrompts] = useState({
    personality: "",
    bestMemory: "",
    legacy: "",
  });

  const birthYear = birthDate ? new Date(birthDate).getFullYear().toString() : undefined;
  const deathYear = deathDate ? new Date(deathDate).getFullYear().toString() : undefined;

  const generateObituary = async (refinement?: string) => {
    if (isGenerating) return;

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/generate-obituary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deceasedName,
          relationship,
          birthYear,
          deathYear,
          birthPlace,
          restingPlace,
          prompts: mode === "prompts" ? prompts : undefined,
          tone,
          length,
          existingText: refinement ? obituary : undefined,
          refinement,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to generate obituary");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                result += parsed.text;
                setObituary(result);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      onSave(result);
      toast.success("Obituary generated");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        toast.info("Generation cancelled");
      } else {
        toast.error("Failed to generate obituary");
        console.error(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const handleManualSave = () => {
    onSave(obituary);
    toast.success("Obituary saved");
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <p className="text-gray-body">
            How would you like to write about {deceasedName}?
          </p>
        </div>

        <div className="grid gap-4">
          {writingModes.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => setMode(option.id)}
              className="flex items-center gap-4 p-4 rounded-xl border border-sage-pale hover:border-sage hover:bg-sage-pale/30 transition-colors text-left"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center shrink-0">
                <option.icon className="w-6 h-6 text-sage" />
              </div>
              <div>
                <h3 className="font-medium text-gray-dark">{option.title}</h3>
                <p className="text-sm text-gray-body">{option.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Manual writing mode
  if (mode === "manual") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode(null)}
            className="text-sm text-sage hover:text-sage-dark"
          >
            ← Change mode
          </button>
          <Badge variant="secondary" size="sm">
            <PenLine className="w-3 h-3 mr-1" />
            Writing manually
          </Badge>
        </div>

        <textarea
          value={obituary}
          onChange={(e) => setObituary(e.target.value)}
          placeholder={`Write about ${deceasedName} in your own words...`}
          className="w-full h-64 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-y"
        />

        <div className="flex justify-end">
          <Button onClick={handleManualSave} disabled={!obituary.trim()}>
            Save Obituary
          </Button>
        </div>
      </div>
    );
  }

  // Prompt-based mode
  if (mode === "prompts") {
    const canGenerate = prompts.personality || prompts.bestMemory || prompts.legacy;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode(null)}
            className="text-sm text-sage hover:text-sage-dark"
          >
            ← Change mode
          </button>
          <Badge variant="secondary" size="sm">
            <MessageSquare className="w-3 h-3 mr-1" />
            Guided prompts
          </Badge>
        </div>

        {/* Prompts */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              What words best describe {deceasedName}?
            </label>
            <textarea
              value={prompts.personality}
              onChange={(e) => setPrompts({ ...prompts, personality: e.target.value })}
              placeholder="Caring, funny, always there for family, loved gardening..."
              className="w-full h-20 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              What&apos;s your favorite memory together?
            </label>
            <textarea
              value={prompts.bestMemory}
              onChange={(e) => setPrompts({ ...prompts, bestMemory: e.target.value })}
              placeholder="Sunday dinners at her house, teaching me to ride a bike..."
              className="w-full h-20 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              How do you want {deceasedName} to be remembered?
            </label>
            <textarea
              value={prompts.legacy}
              onChange={(e) => setPrompts({ ...prompts, legacy: e.target.value })}
              placeholder="As someone who put family first, who made everyone laugh..."
              className="w-full h-20 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Options toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 text-sm text-gray-body hover:text-gray-dark"
        >
          {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Writing options
        </button>

        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        tone === option.value
                          ? "bg-sage text-white"
                          : "bg-sage-pale/50 text-gray-body hover:bg-sage-pale"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">Length</label>
                <div className="flex flex-wrap gap-2">
                  {lengthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLength(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        length === option.value
                          ? "bg-sage text-white"
                          : "bg-sage-pale/50 text-gray-body hover:bg-sage-pale"
                      }`}
                    >
                      {option.label} ({option.description})
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate button */}
        <Button
          onClick={() => generateObituary()}
          disabled={!canGenerate || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Writing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Obituary
            </>
          )}
        </Button>

        {/* Generated result */}
        {obituary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-dark">Generated Obituary</h4>
              {isGenerating && (
                <button onClick={cancelGeneration} className="text-sm text-red-500 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              value={obituary}
              onChange={(e) => {
                setObituary(e.target.value);
                onSave(e.target.value);
              }}
              className="w-full h-48 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-y"
            />

            {/* Refinement buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("shorter")}
                disabled={isGenerating}
              >
                Shorter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("longer")}
                disabled={isGenerating}
              >
                Longer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("more_formal")}
                disabled={isGenerating}
              >
                More Formal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("more_casual")}
                disabled={isGenerating}
              >
                More Casual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary()}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // AI-only mode (minimal prompts)
  if (mode === "ai") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode(null)}
            className="text-sm text-sage hover:text-sage-dark"
          >
            ← Change mode
          </button>
          <Badge variant="secondary" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-assisted
          </Badge>
        </div>

        {/* Info summary */}
        <Card className="p-4 bg-sage-pale/30">
          <p className="text-sm text-gray-body">
            AI will write an obituary based on the information you&apos;ve provided:
          </p>
          <ul className="mt-2 text-sm text-gray-dark space-y-1">
            <li>• Name: {deceasedName}</li>
            <li>• Your relationship: {relationship}</li>
            {birthYear && deathYear && <li>• {birthYear} - {deathYear}</li>}
            {birthPlace && <li>• Born in {birthPlace}</li>}
            {restingPlace && <li>• Resting place: {restingPlace}</li>}
          </ul>
        </Card>

        {/* Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    tone === option.value
                      ? "bg-sage text-white"
                      : "bg-sage-pale/50 text-gray-body hover:bg-sage-pale"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">Length</label>
            <div className="flex flex-wrap gap-2">
              {lengthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLength(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    length === option.value
                      ? "bg-sage text-white"
                      : "bg-sage-pale/50 text-gray-body hover:bg-sage-pale"
                  }`}
                >
                  {option.label} ({option.description})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        {!obituary && (
          <Button
            onClick={() => generateObituary()}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Writing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Obituary
              </>
            )}
          </Button>
        )}

        {/* Generated result */}
        {obituary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-dark">Generated Obituary</h4>
              {isGenerating && (
                <button onClick={cancelGeneration} className="text-sm text-red-500 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              value={obituary}
              onChange={(e) => {
                setObituary(e.target.value);
                onSave(e.target.value);
              }}
              className="w-full h-48 px-4 py-3 rounded-xl border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-y"
            />

            {/* Refinement buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("shorter")}
                disabled={isGenerating}
              >
                Shorter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("longer")}
                disabled={isGenerating}
              >
                Longer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("more_formal")}
                disabled={isGenerating}
              >
                More Formal
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary("more_casual")}
                disabled={isGenerating}
              >
                More Casual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateObituary()}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}
