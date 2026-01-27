"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  showDownload?: boolean;
  downloadFilename?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  title,
  subtitle,
  showDownload = true,
  downloadFilename = "animated-memory.mp4",
  className = "",
  autoPlay = false,
  loop = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // Seek to position
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Download video
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: open in new tab
      window.open(src, "_blank");
    }
  }, [src, downloadFilename]);

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setShowControls(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("canplay", handleCanPlay);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("canplay", handleCanPlay);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
      {/* Title */}
      {(title || subtitle) && (
        <div className="p-4 bg-sage-dark text-white">
          {title && <h4 className="font-medium">{title}</h4>}
          {subtitle && <p className="text-sm text-sage-pale">{subtitle}</p>}
        </div>
      )}

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          playsInline
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none"
            onClick={togglePlay}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePlay();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Play video"
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-sage-dark ml-1"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 mb-3 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            style={{
              background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
            }}
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center text-white hover:text-sage-pale transition-colors"
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center text-white hover:text-sage-pale transition-colors"
              >
                {isFullscreen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <div className="p-4 bg-sage-pale/30 flex justify-center">
          <Button onClick={handleDownload} variant="outline" size="sm">
            Download Video
          </Button>
        </div>
      )}
    </div>
  );
}
