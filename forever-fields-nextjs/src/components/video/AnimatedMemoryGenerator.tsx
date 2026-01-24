"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea } from "@/components/ui";
import { VideoPlayer } from "./VideoPlayer";

interface AnimatedMemoryGeneratorProps {
  ancestorName: string;
  ancestorPhotoUrl?: string;
  voiceSampleUrl?: string;
  onVideoGenerated?: (videoUrl: string) => void;
}

type GenerationStep = "photo" | "message" | "generating" | "preview";

// Pre-written message templates
const messageTemplates = {
  "birthday": "Happy birthday, my dear! I'm so proud of you. Enjoy your special day and know that I'm always with you.",
  "love": "I love you so much. Never forget how special you are to me. You bring so much joy to everyone around you.",
  "encouragement": "I believe in you. You can do anything you set your mind to. I'm always here cheering you on.",
  "goodnight": "Goodnight, sweetheart. Sleep well and dream of wonderful things. I'll see you in the morning light.",
  "wisdom": "Remember what I always told you: be kind, work hard, and never give up on your dreams.",
};

export function AnimatedMemoryGenerator({
  ancestorName,
  ancestorPhotoUrl,
  voiceSampleUrl,
  onVideoGenerated,
}: AnimatedMemoryGeneratorProps) {
  const [step, setStep] = useState<GenerationStep>("photo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(ancestorPhotoUrl || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(voiceSampleUrl || null);
  const [messageText, setMessageText] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [_isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle photo upload
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setError(null);
  }, []);

  // Handle audio upload
  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setError(null);
  }, []);

  // Generate voice from text (if no audio provided)
  const generateVoice = useCallback(async () => {
    if (!messageText.trim()) {
      setError("Please enter a message");
      return null;
    }

    // In production, this would call the voice cloning API
    // For now, we'll require an audio file or use placeholder
    if (!voiceSampleUrl) {
      setError("Voice sample required. Please upload a voice sample first.");
      return null;
    }

    try {
      const response = await fetch("/api/ai/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceAudioUrl: voiceSampleUrl,
          targetText: messageText,
        }),
      });

      if (!response.ok) throw new Error("Voice generation failed");

      const data = await response.json();
      if (data.demo) {
        return voiceSampleUrl; // Use sample as fallback in demo mode
      }
      return data.audioUrl;
    } catch (err) {
      console.error("Voice generation error:", err);
      return voiceSampleUrl; // Fallback
    }
  }, [messageText, voiceSampleUrl]);

  // Generate animated video
  const generateVideo = useCallback(async () => {
    if (!photoUrl) {
      setError("Please upload a photo first");
      return;
    }

    setIsGenerating(true);
    setStep("generating");
    setError(null);
    setProgress(10);

    try {
      // Step 1: Generate voice if needed
      setProgress(20);
      let finalAudioUrl = audioUrl;

      if (!finalAudioUrl && messageText) {
        finalAudioUrl = await generateVoice();
        if (!finalAudioUrl) {
          throw new Error("Failed to generate voice");
        }
      }

      if (!finalAudioUrl) {
        throw new Error("Audio is required. Please upload voice sample or generate from text.");
      }

      setProgress(40);

      // Step 2: Animate the photo
      const response = await fetch("/api/ai/animate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: photoUrl,
          audioUrl: finalAudioUrl,
          enhanceFace: true,
          stillMode: false,
        }),
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error("Animation generation failed");
      }

      const data = await response.json();

      if (data.demo) {
        setError("Demo mode: Animation requires a Replicate API key. The photo and audio have been prepared.");
        setProgress(100);
        // In demo mode, we can't show real video
        // Show a placeholder message
        setStep("photo");
        setIsGenerating(false);
        return;
      }

      setProgress(100);
      setGeneratedVideoUrl(data.videoUrl);
      setStep("preview");
      onVideoGenerated?.(data.videoUrl);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate animated memory");
      setStep("message");
    } finally {
      setIsGenerating(false);
    }
  }, [photoUrl, audioUrl, messageText, generateVoice, onVideoGenerated]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Animated Memory</CardTitle>
        <CardDescription>
          Bring {ancestorName}'s photo to life with their voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Photo Selection */}
        {(step === "photo" || step === "message") && (
          <>
            <div>
              <h3 className="font-medium text-sage-dark mb-3">
                1. Choose a photo of {ancestorName}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-sage-light rounded-lg p-4 text-center hover:border-sage transition-colors">
                  {photoUrl ? (
                    <div className="relative">
                      <Image
                        src={photoUrl}
                        alt="Selected photo"
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover rounded-lg"
                        unoptimized={photoUrl.startsWith("blob:") || photoUrl.startsWith("data:")}
                      />
                      <button
                        onClick={() => setPhotoUrl(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm text-gray-500 mb-3">
                        Best: Clear face, front-facing
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-input"
                      />
                      <label htmlFor="photo-input" className="inline-block">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border border-sage rounded-xl cursor-pointer hover:bg-sage/10 transition-colors">
                          Upload Photo
                        </span>
                      </label>
                    </>
                  )}
                </div>

                {/* Audio Upload */}
                <div className="border-2 border-dashed border-sage-light rounded-lg p-4 text-center hover:border-sage transition-colors">
                  {audioUrl ? (
                    <div>
                      <div className="text-4xl mb-2">🎵</div>
                      <p className="text-sm text-gray-600 mb-2">Audio ready</p>
                      <audio src={audioUrl} controls className="w-full mb-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAudioUrl(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">🎙️</div>
                      <p className="text-sm text-gray-500 mb-3">
                        Voice sample or message audio
                      </p>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        id="audio-input"
                      />
                      <label htmlFor="audio-input" className="inline-block">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border border-sage rounded-xl cursor-pointer hover:bg-sage/10 transition-colors">
                          Upload Audio
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Message (optional) */}
            <div>
              <h3 className="font-medium text-sage-dark mb-3">
                2. What should they say? (optional if audio uploaded)
              </h3>

              {/* Quick Templates */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(messageTemplates).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setMessageText(value)}
                    className="px-3 py-1 text-sm bg-sage-pale text-sage-dark rounded-full hover:bg-sage-light transition-colors capitalize"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message for them to say..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep messages under 200 characters for best results
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={generateVideo}
                disabled={!photoUrl || (!audioUrl && !messageText)}
              >
                Create Animated Memory
              </Button>
            </div>
          </>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="py-12 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Animated photo placeholder */}
              {photoUrl && (
                <Image
                  src={photoUrl}
                  alt="Processing"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-full animate-pulse"
                  unoptimized={photoUrl.startsWith("blob:") || photoUrl.startsWith("data:")}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full border-4 border-sage border-t-transparent rounded-full animate-spin" />
              </div>
            </div>

            <h3 className="font-display text-xl text-sage-dark mb-2">
              Creating Your Animated Memory
            </h3>
            <p className="text-gray-500 mb-4">
              {progress < 30 && "Preparing voice..."}
              {progress >= 30 && progress < 70 && "Animating photo..."}
              {progress >= 70 && "Finalizing video..."}
            </p>

            {/* Progress Bar */}
            <div className="w-64 mx-auto">
              <div className="h-2 bg-sage-pale rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && generatedVideoUrl && (
          <div className="space-y-4">
            <VideoPlayer
              src={generatedVideoUrl}
              poster={photoUrl || undefined}
              title={`Message from ${ancestorName}`}
              showDownload={true}
              downloadFilename={`${ancestorName.toLowerCase().replace(/\s+/g, "-")}-message.mp4`}
            />

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("photo");
                  setGeneratedVideoUrl(null);
                  setProgress(0);
                }}
              >
                Create Another
              </Button>
              <Button
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: `Message from ${ancestorName}`,
                      text: `A special animated memory`,
                      url: generatedVideoUrl,
                    });
                  } else {
                    navigator.clipboard.writeText(generatedVideoUrl);
                    toast.success("Video URL copied to clipboard!");
                  }
                }}
              >
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
          <p className="font-medium">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Upload a clear, front-facing photo</li>
            <li>Add a voice sample or type a message</li>
            <li>AI animates the face to match the audio</li>
            <li>Download and share the animated memory</li>
          </ol>
          <p className="mt-2 text-sage">
            Powered by SadTalker AI. Results may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
