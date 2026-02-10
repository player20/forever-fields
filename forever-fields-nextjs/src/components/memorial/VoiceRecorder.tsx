"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import {
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Upload,
  AlertCircle,
  Check,
  Volume2,
} from "lucide-react";

interface VoiceRecorderProps {
  memorialId: string;
  userId?: string;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  onUpload?: (blob: Blob) => Promise<void>;
  maxDuration?: number;
  className?: string;
}

export function VoiceRecorder({
  memorialId,
  userId,
  onRecordingComplete,
  onUpload,
  maxDuration = 120,
  className = "",
}: VoiceRecorderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    formattedDuration,
    formattedMaxDuration,
    isSupported,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder({
    maxDuration,
    memorialId,
    userId,
    enableWatermark: true,
  });

  // Check browser support
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupported()) {
      return;
    }

    // Check if permission was previously granted
    navigator.permissions?.query({ name: "microphone" as PermissionName }).then((result) => {
      setPermissionGranted(result.state === "granted");
    });
  }, [isSupported]);

  // Handle recording complete
  useEffect(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, duration);
    }
  }, [audioBlob, duration, onRecordingComplete]);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
  };

  const handleStartRecording = async () => {
    setUploadSuccess(false);
    await startRecording();
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleUpload = async () => {
    if (!audioBlob || !onUpload) return;

    setIsUploading(true);
    try {
      await onUpload(audioBlob);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Browser not supported
  if (!isSupported()) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-start gap-3 text-amber-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Recording Not Supported</p>
            <p className="text-sm text-gray-body mt-1">
              Your browser doesn&apos;t support audio recording. Please try using
              Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Permission not granted
  if (permissionGranted === false) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-sage-pale rounded-full flex items-center justify-center">
            <Mic className="w-6 h-6 text-sage" />
          </div>
          <h3 className="font-medium text-gray-dark mb-2">
            Microphone Access Required
          </h3>
          <p className="text-sm text-gray-body mb-4">
            To record a voice message, please allow access to your microphone.
          </p>
          <Button onClick={handleRequestPermission}>
            <Mic className="w-4 h-4 mr-2" />
            Enable Microphone
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-dark">Record Voice Message</h3>
          <span className="text-sm text-gray-muted">
            Max {formattedMaxDuration}
          </span>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Visualization */}
        <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden">
          {isRecording ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                backgroundColor: isPaused
                  ? "rgba(156, 163, 175, 0.1)"
                  : "rgba(99, 151, 102, 0.1)",
              }}
            >
              {/* Audio wave visualization */}
              <div className="flex items-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-sage rounded-full"
                    animate={{
                      height: isPaused
                        ? 8
                        : [8, Math.random() * 40 + 8, 8],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ) : audioUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center hover:bg-sage-dark transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-muted" />
                  <span className="text-sm text-gray-body">
                    {formattedDuration}
                  </span>
                </div>
              </div>
              <audio ref={audioRef} src={audioUrl} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-muted">
              <Mic className="w-8 h-8" />
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: isPaused ? 0.5 : [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-gray-dark">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
          )}

          {/* Duration display */}
          {isRecording && (
            <div className="absolute top-3 right-3 font-mono text-sm text-gray-dark">
              {formattedDuration} / {formattedMaxDuration}
            </div>
          )}

          {/* Progress bar */}
          {isRecording && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <motion.div
                className="h-full bg-sage"
                initial={{ width: 0 }}
                animate={{ width: `${(duration / maxDuration) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !audioUrl && (
            <Button
              onClick={handleStartRecording}
              className="bg-coral hover:bg-coral-dark"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="outline"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button onClick={stopRecording} variant="primary">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}

          {audioUrl && !uploadSuccess && (
            <>
              <Button onClick={clearRecording} variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Discard
              </Button>
              <Button onClick={handleStartRecording} variant="outline">
                <Mic className="w-4 h-4 mr-2" />
                Re-record
              </Button>
              {onUpload && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-sage hover:bg-sage-dark"
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 text-sage">
              <Check className="w-5 h-5" />
              <span className="font-medium">Voice message submitted!</span>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-center text-gray-muted">
          Your recording will be reviewed before appearing on the memorial.
          {" "}Recordings include a watermark for authenticity verification.
        </p>
      </div>
    </Card>
  );
}
