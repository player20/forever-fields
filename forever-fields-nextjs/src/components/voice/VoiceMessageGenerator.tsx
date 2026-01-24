"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea } from "@/components/ui";

interface VoiceProfile {
  id: string;
  ancestorName: string;
  sampleUrls: string[];
  createdAt: Date;
}

interface GeneratedMessage {
  id: string;
  text: string;
  audioUrl: string | null;
  createdAt: Date;
  occasion?: string;
}

interface VoiceMessageGeneratorProps {
  voiceProfile: VoiceProfile;
  onMessageGenerated?: (message: GeneratedMessage) => void;
}

// Pre-written message templates for common occasions
const messageTemplates = {
  birthday: [
    "Happy birthday, my dear! I'm so proud of the person you've become. Enjoy your special day.",
    "Another year older, another year wiser. Happy birthday! Know that I'm always with you in spirit.",
    "Wishing you the happiest of birthdays. May all your dreams come true this year.",
  ],
  graduation: [
    "Congratulations on your graduation! All your hard work has paid off. I'm so proud of you.",
    "You did it! This is just the beginning of an amazing journey. Go make us proud.",
    "Today marks a wonderful achievement. Remember, education opens doors. Congratulations!",
  ],
  encouragement: [
    "I believe in you. You've got this. Remember, you come from strong people.",
    "When things get tough, remember how much you are loved. You can do hard things.",
    "Every challenge is an opportunity to grow. I know you'll come out stronger.",
  ],
  goodnight: [
    "Goodnight, sweetheart. Sweet dreams. I love you to the moon and back.",
    "Sleep well, my dear. Tomorrow is a new day full of possibilities.",
    "Rest easy tonight. You are loved more than you know.",
  ],
  "i-love-you": [
    "I love you. I'm always here, watching over you, cheering you on.",
    "Never forget how much you mean to me. I love you with all my heart.",
    "My love for you is endless. Carry it with you always.",
  ],
};

export function VoiceMessageGenerator({
  voiceProfile,
  onMessageGenerated,
}: VoiceMessageGeneratorProps) {
  const [messageText, setMessageText] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Select a template
  const selectTemplate = useCallback((occasion: string, index: number) => {
    const templates = messageTemplates[occasion as keyof typeof messageTemplates];
    if (templates && templates[index]) {
      setMessageText(templates[index]);
      setSelectedOccasion(occasion);
    }
  }, []);

  // Generate voice message
  const generateMessage = useCallback(async () => {
    if (!messageText.trim()) {
      setError("Please enter a message to generate");
      return;
    }

    if (voiceProfile.sampleUrls.length === 0) {
      setError("No voice samples available. Please upload voice samples first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAudio(null);

    try {
      const response = await fetch("/api/ai/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceAudioUrl: voiceProfile.sampleUrls[0], // Use first sample
          targetText: messageText,
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error("Voice generation failed");
      }

      const data = await response.json();

      if (data.demo) {
        setError("Demo mode: Voice cloning requires a Replicate API key");
        return;
      }

      setGeneratedAudio(data.audioUrl);

      const message: GeneratedMessage = {
        id: `msg-${Date.now()}`,
        text: messageText,
        audioUrl: data.audioUrl,
        createdAt: new Date(),
        occasion: selectedOccasion || undefined,
      };

      onMessageGenerated?.(message);
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate voice message. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [messageText, voiceProfile, selectedOccasion, onMessageGenerated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Voice Message</CardTitle>
        <CardDescription>
          Generate a message in {voiceProfile.ancestorName}'s voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Occasion Templates */}
        <div>
          <h3 className="text-sm font-medium text-sage-dark mb-3">
            Choose an occasion or write your own:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(messageTemplates).map((occasion) => (
              <button
                key={occasion}
                onClick={() => {
                  const templates = messageTemplates[occasion as keyof typeof messageTemplates];
                  selectTemplate(occasion, Math.floor(Math.random() * templates.length));
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedOccasion === occasion
                    ? "bg-sage text-white"
                    : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                }`}
              >
                {occasion === "birthday" && "🎂 Birthday"}
                {occasion === "graduation" && "🎓 Graduation"}
                {occasion === "encouragement" && "💪 Encouragement"}
                {occasion === "goodnight" && "🌙 Goodnight"}
                {occasion === "i-love-you" && "❤️ I Love You"}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Write a message in ${voiceProfile.ancestorName}'s voice...`}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {messageText.length} characters • Keep messages under 500 characters for best results
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Generated Audio */}
        {generatedAudio && (
          <div className="bg-sage-pale/30 rounded-lg p-4">
            <h3 className="font-medium text-sage-dark mb-3">
              Generated Voice Message
            </h3>
            <audio
              src={generatedAudio}
              controls
              className="w-full"
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = generatedAudio;
                  link.download = `${voiceProfile.ancestorName}-message.mp3`;
                  link.click();
                }}
              >
                Download Audio
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedAudio(null);
                  setMessageText("");
                  setSelectedOccasion(null);
                }}
              >
                Create Another
              </Button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {!generatedAudio && (
          <div className="flex justify-end">
            <Button
              onClick={generateMessage}
              disabled={isGenerating || !messageText.trim()}
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Voice...
                </>
              ) : (
                <>
                  🎙️ Generate Voice Message
                </>
              )}
            </Button>
          </div>
        )}

        {/* Voice Quality Notice */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <p className="font-medium mb-1">About voice generation:</p>
          <ul className="space-y-1">
            <li>• Generated using AI voice cloning (F5-TTS)</li>
            <li>• Results vary based on voice sample quality</li>
            <li>• Best with clear speech samples (3+ seconds)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
