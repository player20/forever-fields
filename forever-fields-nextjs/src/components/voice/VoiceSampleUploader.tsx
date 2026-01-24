"use client";

import { useState, useCallback, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

interface VoiceSample {
  id: string;
  name: string;
  type: "audio" | "video";
  url: string;
  duration?: number;
  uploadedAt: Date;
}

interface VoiceSampleUploaderProps {
  ancestorName: string;
  existingSamples?: VoiceSample[];
  onSampleUpload?: (sample: VoiceSample) => void;
  onSampleDelete?: (sampleId: string) => void;
  onComplete?: (samples: VoiceSample[]) => void;
}

export function VoiceSampleUploader({
  ancestorName,
  existingSamples = [],
  onSampleUpload,
  onSampleDelete,
  onComplete,
}: VoiceSampleUploaderProps) {
  const [samples, setSamples] = useState<VoiceSample[]>(existingSamples);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "processing">("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        // Check file type
        const isVideo = file.type.startsWith("video/");
        const isAudio = file.type.startsWith("audio/");

        if (!isVideo && !isAudio) {
          setError("Please upload audio or video files only");
          continue;
        }

        // Create object URL for preview
        const url = URL.createObjectURL(file);

        // Get duration
        const duration = await getMediaDuration(url, isVideo ? "video" : "audio");

        // Check minimum duration (3 seconds for voice cloning)
        if (duration < 3) {
          setError("Voice samples need to be at least 3 seconds long");
          URL.revokeObjectURL(url);
          continue;
        }

        const sample: VoiceSample = {
          id: `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: isVideo ? "video" : "audio",
          url,
          duration,
          uploadedAt: new Date(),
        };

        setSamples((prev) => [...prev, sample]);
        onSampleUpload?.(sample);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to process file");
      }
    }

    setIsUploading(false);
    // Reset input
    e.target.value = "";
  }, [onSampleUpload]);

  // Get media duration
  const getMediaDuration = (url: string, type: "video" | "audio"): Promise<number> => {
    return new Promise((resolve) => {
      const element = document.createElement(type);
      element.src = url;
      element.addEventListener("loadedmetadata", () => {
        resolve(element.duration);
      });
      element.addEventListener("error", () => {
        resolve(0);
      });
    });
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingState("processing");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        const duration = await getMediaDuration(url, "audio");

        if (duration < 3) {
          setError("Recording must be at least 3 seconds. Try again!");
          URL.revokeObjectURL(url);
          setRecordingState("idle");
          return;
        }

        const sample: VoiceSample = {
          id: `recording-${Date.now()}`,
          name: `Recording ${new Date().toLocaleTimeString()}`,
          type: "audio",
          url,
          duration,
          uploadedAt: new Date(),
        };

        setSamples((prev) => [...prev, sample]);
        onSampleUpload?.(sample);
        setRecordingState("idle");

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  }, [onSampleUpload]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  // Delete sample
  const deleteSample = useCallback((sampleId: string) => {
    setSamples((prev) => {
      const sample = prev.find((s) => s.id === sampleId);
      if (sample) {
        URL.revokeObjectURL(sample.url);
      }
      return prev.filter((s) => s.id !== sampleId);
    });
    onSampleDelete?.(sampleId);
  }, [onSampleDelete]);

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate total duration
  const totalDuration = samples.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Samples for {ancestorName}</CardTitle>
        <CardDescription>
          Upload voicemails, videos, or recordings to clone their voice.
          More samples = better quality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-sage-light rounded-lg p-6 text-center hover:border-sage transition-colors">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-600 mb-3 text-sm">
              Upload voicemails, videos, or audio files
            </p>
            <input
              type="file"
              accept="audio/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="voice-upload"
              disabled={isUploading}
            />
            <label htmlFor="voice-upload">
              <span className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border border-sage rounded-xl cursor-pointer hover:bg-sage/10 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isUploading ? "Uploading..." : "Choose Files"}
              </span>
            </label>
          </div>

          {/* Record Voice */}
          <div className="border-2 border-dashed border-sage-light rounded-lg p-6 text-center hover:border-sage transition-colors">
            <div className="text-4xl mb-3">🎙️</div>
            <p className="text-gray-600 mb-3 text-sm">
              Record yourself reading in their style
            </p>
            {recordingState === "idle" && (
              <Button variant="outline" size="sm" onClick={startRecording}>
                Start Recording
              </Button>
            )}
            {recordingState === "recording" && (
              <Button variant="secondary" size="sm" onClick={stopRecording}>
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                Stop Recording
              </Button>
            )}
            {recordingState === "processing" && (
              <Button variant="outline" size="sm" disabled>
                Processing...
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Samples List */}
        {samples.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sage-dark">
                Uploaded Samples ({samples.length})
              </h3>
              <span className="text-sm text-gray-500">
                Total: {formatDuration(totalDuration)}
              </span>
            </div>

            <div className="space-y-2">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="flex items-center gap-3 p-3 bg-sage-pale/30 rounded-lg"
                >
                  <span className="text-2xl">
                    {sample.type === "video" ? "🎬" : "🎵"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sage-dark truncate">
                      {sample.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDuration(sample.duration)}
                    </p>
                  </div>
                  <audio
                    src={sample.url}
                    controls
                    className="h-8 w-32"
                  />
                  <button
                    onClick={() => deleteSample(sample.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Indicator */}
        <div className="bg-sage-pale/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-sage-dark">Voice Quality</span>
            <span className="text-sm text-gray-500">
              {totalDuration < 10 ? "Needs more samples" :
               totalDuration < 30 ? "Good" :
               totalDuration < 60 ? "Very Good" : "Excellent"}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalDuration < 10 ? "bg-yellow-400" :
                totalDuration < 30 ? "bg-sage-light" :
                totalDuration < 60 ? "bg-sage" : "bg-green-500"
              }`}
              style={{ width: `${Math.min((totalDuration / 60) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {totalDuration < 10
              ? "Add more voice samples (at least 10 seconds recommended)"
              : totalDuration < 30
              ? "Good start! More samples will improve quality"
              : "Great! You have enough samples for good voice cloning"}
          </p>
        </div>

        {/* Tips */}
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-medium">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Clear audio with minimal background noise</li>
            <li>Voicemails and phone messages work great</li>
            <li>Videos where they speak directly to camera</li>
            <li>Multiple samples help capture their natural voice</li>
          </ul>
        </div>

        {/* Actions */}
        {onComplete && samples.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onComplete(samples)} disabled={totalDuration < 3}>
              Continue with {samples.length} Sample{samples.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
