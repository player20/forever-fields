"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Sparkles, Loader2, FlaskConical, X } from "lucide-react";

interface LivingPortraitProps {
  imageUrl: string;
  videoUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  showControls?: boolean;
  autoPlay?: boolean;
  isGenerating?: boolean;
  onGenerateRequest?: () => void;
  betaMode?: boolean; // When true, shows beta opt-in prompt before generating
}

export function LivingPortrait({
  imageUrl,
  videoUrl,
  name,
  size = "lg",
  showControls = true,
  isGenerating = false,
  onGenerateRequest,
  betaMode = false,
}: LivingPortraitProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showBetaPrompt, setShowBetaPrompt] = useState(false);
  const [hasOptedIn, setHasOptedIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32 md:w-40 md:h-40",
    lg: "w-36 h-36 md:w-44 md:h-44",
  };

  const imageSizes = {
    sm: 96,
    md: 160,
    lg: 176,
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayToggle = () => {
    // Beta mode - show opt-in prompt first (unless already opted in)
    if (betaMode && !hasOptedIn && !videoUrl) {
      setShowBetaPrompt(true);
      return;
    }

    if (!videoUrl || videoError) {
      // No video yet or failed - request generation
      setVideoError(false);
      onGenerateRequest?.();
      return;
    }

    if (!showVideo) {
      setIsLoading(true);
      setShowVideo(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleBetaOptIn = () => {
    setHasOptedIn(true);
    setShowBetaPrompt(false);
    // Trigger generation after opt-in
    onGenerateRequest?.();
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setShowVideo(false);
    setVideoError(true);
  };

  return (
    <>
      <motion.div
        animate={!showVideo ? { y: [0, -6, 0] } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative group"
      >
        {/* Glowing aura effect */}
        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-gold/50 via-white/40 to-gold/50 blur-lg"
        />

        {/* Portrait container */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full border-4 border-white/90 shadow-2xl overflow-hidden bg-sage-pale`}
        >
          {/* Static image (shown when video not playing) */}
          <AnimatePresence>
            {!showVideo && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-full h-full"
                >
                  <Image
                    src={imageUrl}
                    alt={name}
                    width={imageSizes[size]}
                    height={imageSizes[size]}
                    className="object-cover w-full h-full"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated video */}
          {showVideo && videoUrl && !videoError && (
            <video
              ref={videoRef}
              src={videoUrl}
              loop
              muted
              playsInline
              onLoadedData={handleVideoLoaded}
              onError={handleVideoError}
              className="w-full h-full object-cover"
            />
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Play/Pause control button */}
        {showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayToggle}
            disabled={isGenerating}
            className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors z-10 disabled:opacity-70 ${
              betaMode && !hasOptedIn && !videoUrl
                ? "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 hover:from-purple-200 hover:to-indigo-200"
                : "bg-white text-sage-dark hover:bg-sage-pale"
            }`}
            title={
              betaMode && !hasOptedIn && !videoUrl
                ? "Try Living Portrait (Beta)"
                : isGenerating
                ? "Generating..."
                : !videoUrl || videoError
                ? "Generate living portrait"
                : isPlaying
                ? "Pause"
                : "Play living portrait"
            }
          >
            {betaMode && !hasOptedIn && !videoUrl ? (
              <FlaskConical className="w-5 h-5" />
            ) : isGenerating ? (
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
            ) : !videoUrl || videoError ? (
              <Sparkles className="w-5 h-5 text-gold" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>
        )}

        {/* "Beta" badge when in beta mode and not yet opted in */}
        {betaMode && !hasOptedIn && !videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-0.5 rounded-full shadow whitespace-nowrap"
          >
            <FlaskConical className="w-3 h-3 inline mr-1" />
            Beta
          </motion.div>
        )}

        {/* "Living Portrait" badge when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-amber-500 text-white text-xs px-2 py-0.5 rounded-full shadow whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Living Portrait
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Beta Opt-In Modal */}
      <AnimatePresence>
        {showBetaPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowBetaPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBetaPrompt(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-purple-600" />
                </div>

                <h3 className="font-serif text-xl text-gray-900 mb-2">
                  Try Living Portraits
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  Beta Feature
                </p>

                <p className="text-gray-600 mt-4 mb-6">
                  This AI feature gently brings photos to life with subtle, respectful animation.
                  We&apos;re still perfecting it and would love your feedback.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Generation takes 30-60 seconds. Results may vary
                    depending on photo quality and lighting.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBetaPrompt(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleBetaOptIn}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
                  >
                    Try It
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
