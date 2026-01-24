"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea, Input } from "@/components/ui";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface KeyPoint {
  theme: string;
  content: string;
}

interface ExtractedMemory {
  summary: string;
  keyPoints: KeyPoint[];
  suggestedTitle: string;
  formattedMemory: string;
  rawTranscript: string;
  emotionalTone?: string;
  questions?: string[];
}

interface VoiceMemoryCaptureProps {
  deceasedName: string;
  relationship?: string;
  onSave?: (memory: { title: string; content: string; keyPoints: KeyPoint[] }) => void;
  onCancel?: () => void;
}

type CaptureStep = "record" | "processing" | "review" | "edit";

export function VoiceMemoryCapture({
  deceasedName,
  relationship = "loved one",
  onSave,
  onCancel,
}: VoiceMemoryCaptureProps) {
  const [step, setStep] = useState<CaptureStep>("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [extractedMemory, setExtractedMemory] = useState<ExtractedMemory | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedKeyPoints, setEditedKeyPoints] = useState<KeyPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();

      // Set up Speech Recognition for real-time transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript + " ";
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript((prev) => {
            // Append final transcript, show interim
            const base = finalTranscript ? prev + finalTranscript : prev;
            return base + (interimTranscript ? `[${interimTranscript}]` : "");
          });
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);

    // Clean up transcript (remove interim markers)
    setTranscript((t) => t.replace(/\[.*?\]/g, "").trim());
  }, []);

  // Process transcript with AI
  const processTranscript = useCallback(async () => {
    const cleanTranscript = transcript.replace(/\[.*?\]/g, "").trim();

    if (!cleanTranscript || cleanTranscript.length < 20) {
      setError("Please record a longer message (at least a few sentences)");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      const response = await fetch("/api/ai/transcribe-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: cleanTranscript,
          deceasedName,
          relationship,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process memory");
      }

      const data = await response.json();

      setExtractedMemory(data);
      setEditedTitle(data.suggestedTitle || "");
      setEditedContent(data.formattedMemory || cleanTranscript);
      setEditedKeyPoints(data.keyPoints || []);
      setStep("review");
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process your memory. Please try again.");
      setStep("record");
    }
  }, [transcript, deceasedName, relationship]);

  // Save memory
  const handleSave = useCallback(() => {
    onSave?.({
      title: editedTitle,
      content: editedContent,
      keyPoints: editedKeyPoints,
    });
  }, [editedTitle, editedContent, editedKeyPoints, onSave]);

  // Update a key point
  const updateKeyPoint = useCallback((index: number, field: "theme" | "content", value: string) => {
    setEditedKeyPoints((points) =>
      points.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }, []);

  // Remove a key point
  const removeKeyPoint = useCallback((index: number) => {
    setEditedKeyPoints((points) => points.filter((_, i) => i !== index));
  }, []);

  // Add a key point
  const addKeyPoint = useCallback(() => {
    setEditedKeyPoints((points) => [...points, { theme: "Memory", content: "" }]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share a Memory</CardTitle>
        <CardDescription>
          Speak your thoughts about {deceasedName} and we'll help organize them
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Record Step */}
        {step === "record" && (
          <div className="space-y-6">
            {/* Prompts */}
            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">
                Share what's in your heart...
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tell a story about {deceasedName}</li>
                <li>• Describe what made them special</li>
                <li>• Share a funny or meaningful moment</li>
                <li>• Talk about what you'll miss most</li>
              </ul>
            </div>

            {/* Recording Area */}
            <div className="text-center py-8">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 bg-sage text-white rounded-full flex items-center justify-center mx-auto hover:bg-sage-dark transition-colors shadow-lg"
                  >
                    <span className="text-4xl">🎙️</span>
                  </button>
                  <p className="mt-4 text-gray-500">
                    Tap to start recording
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto hover:bg-red-600 transition-colors shadow-lg animate-pulse"
                  >
                    <span className="text-3xl">■</span>
                  </button>
                  <p className="mt-4 text-red-500 font-medium">
                    Recording... {formatTime(recordingTime)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tap to stop
                  </p>
                </>
              )}
            </div>

            {/* Live Transcript */}
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2 text-sm">
                  What we're hearing:
                </h4>
                <p className="text-gray-600 text-sm italic">
                  "{transcript.replace(/\[.*?\]/g, "...")}"
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
            {!isRecording && transcript && (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTranscript("");
                    setRecordingTime(0);
                  }}
                >
                  Start Over
                </Button>
                <Button onClick={processTranscript}>
                  Continue →
                </Button>
              </div>
            )}

            {/* Or Type Instead */}
            <div className="text-center">
              <button
                onClick={() => setStep("edit")}
                className="text-sm text-sage hover:underline"
              >
                Or type your memory instead
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 border-4 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-display text-xl text-sage-dark">
              Capturing your memory...
            </h3>
            <p className="text-gray-500 mt-2">
              Finding the key moments and themes
            </p>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && extractedMemory && (
          <div className="space-y-6">
            <div className="bg-sage-pale/30 rounded-lg p-4 text-center">
              <h3 className="font-medium text-sage-dark text-lg mb-1">
                Here's what I got:
              </h3>
              <p className="text-sm text-gray-500">
                Review and edit if needed
              </p>
            </div>

            {/* Summary */}
            {extractedMemory.summary && (
              <div className="bg-gold/10 rounded-lg p-4">
                <p className="text-sage-dark italic">"{extractedMemory.summary}"</p>
                {extractedMemory.emotionalTone && (
                  <span className="inline-block mt-2 text-xs bg-white px-2 py-1 rounded text-gray-500">
                    Tone: {extractedMemory.emotionalTone}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-sage-dark mb-1">
                Title
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Title for this memory"
              />
            </div>

            {/* Key Points */}
            <div>
              <label className="block text-sm font-medium text-sage-dark mb-2">
                Key Points
              </label>
              <div className="space-y-3">
                {editedKeyPoints.map((point, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      value={point.theme}
                      onChange={(e) => updateKeyPoint(index, "theme", e.target.value)}
                      placeholder="Theme"
                      className="w-32 flex-shrink-0"
                    />
                    <Input
                      value={point.content}
                      onChange={(e) => updateKeyPoint(index, "content", e.target.value)}
                      placeholder="What you shared..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeKeyPoint(index)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addKeyPoint}
                  className="text-sm text-sage hover:underline"
                >
                  + Add another point
                </button>
              </div>
            </div>

            {/* Full Memory */}
            <div>
              <label className="block text-sm font-medium text-sage-dark mb-1">
                Full Memory
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Follow-up Questions */}
            {extractedMemory.questions && extractedMemory.questions.length > 0 && (
              <div className="bg-sage-pale/20 rounded-lg p-4">
                <h4 className="font-medium text-sage-dark mb-2 text-sm">
                  Want to add more? Consider:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {extractedMemory.questions.map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("record");
                  setTranscript("");
                  setExtractedMemory(null);
                }}
              >
                Record Again
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave}>
                Save Memory
              </Button>
            </div>
          </div>
        )}

        {/* Edit Step (typing instead of recording) */}
        {step === "edit" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sage-dark mb-1">
                Title
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Title for this memory"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-dark mb-1">
                Your Memory
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder={`Share your memory of ${deceasedName}...`}
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep("record")}>
                ← Record Instead
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!editedContent.trim()}
              >
                Save Memory
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

