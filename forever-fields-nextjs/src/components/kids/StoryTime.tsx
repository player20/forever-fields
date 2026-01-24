"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button, Card, CardContent } from "@/components/ui";

interface Story {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  recordedBy?: string;
  duration?: number; // in seconds
  photos?: string[]; // Photos to show during story
}

interface StoryTimeProps {
  ancestorName: string;
  ancestorPhoto?: string;
  stories: Story[];
  onRecordStory?: () => void;
}

export function StoryTime({
  ancestorName,
  ancestorPhoto,
  stories,
  onRecordStory,
}: StoryTimeProps) {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio playback handling
  useEffect(() => {
    if (currentStory?.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentStory]);

  // Progress update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(percent || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      // Auto-play next story?
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentStory]);

  // Sleep timer
  useEffect(() => {
    if (sleepMinutes === null) return;

    const timeout = setTimeout(() => {
      setIsPlaying(false);
      setSleepMinutes(null);
    }, sleepMinutes * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [sleepMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Story list view
  if (!currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-twilight/10 to-cream p-4">
        <div className="max-w-md mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-twilight/30">
              {ancestorPhoto ? (
                <Image src={ancestorPhoto} alt={ancestorName} width={80} height={80} className="w-full h-full object-cover" unoptimized={ancestorPhoto.startsWith("blob:") || ancestorPhoto.startsWith("data:")} />
              ) : (
                <div className="w-full h-full bg-twilight/20 flex items-center justify-center text-3xl">
                  🌙
                </div>
              )}
            </div>
            <h1 className="font-display text-3xl text-sage-dark">Story Time</h1>
            <p className="text-gray-600">Stories about {ancestorName}</p>
          </div>

          {/* Story list */}
          {stories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <span className="text-5xl block mb-4">📚</span>
                <p className="text-gray-600 mb-4">
                  No stories recorded yet.
                </p>
                {onRecordStory && (
                  <Button onClick={onRecordStory}>
                    🎙️ Record the First Story
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setCurrentStory(story)}
                  className="w-full p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sage-pale rounded-full flex items-center justify-center">
                      {story.audioUrl ? (
                        <span className="text-2xl">🎧</span>
                      ) : (
                        <span className="text-2xl">📖</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sage-dark">{story.title}</p>
                      {story.recordedBy && (
                        <p className="text-sm text-gray-500">
                          Read by {story.recordedBy}
                        </p>
                      )}
                    </div>
                    {story.duration && (
                      <span className="text-sm text-gray-400">
                        {formatTime(story.duration)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Record new story button */}
          {stories.length > 0 && onRecordStory && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={onRecordStory}>
                🎙️ Add Another Story
              </Button>
            </div>
          )}

          {/* Sleep timer toggle */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowSleepTimer(!showSleepTimer)}
              className="text-sm text-gray-500 hover:text-sage"
            >
              🌙 Bedtime Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Story playback view
  return (
    <div className="min-h-screen bg-gradient-to-b from-twilight/20 to-twilight/5 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Back button */}
        <button
          onClick={() => {
            setCurrentStory(null);
            setIsPlaying(false);
            setProgress(0);
          }}
          className="text-gray-500 hover:text-sage mb-6 flex items-center gap-2"
        >
          ← Back to stories
        </button>

        {/* Story card */}
        <Card className="overflow-hidden">
          {/* Cover image */}
          <div className="h-48 bg-gradient-to-b from-sage-pale to-sage-light flex items-center justify-center">
            {currentStory.photos?.[0] ? (
              <Image
                src={currentStory.photos[0]}
                alt=""
                width={400}
                height={192}
                className="w-full h-full object-cover"
                unoptimized={currentStory.photos[0].startsWith("blob:") || currentStory.photos[0].startsWith("data:")}
              />
            ) : (
              <span className="text-6xl">📖</span>
            )}
          </div>

          <CardContent className="py-6">
            {/* Title */}
            <h2 className="font-display text-2xl text-sage-dark mb-1">
              {currentStory.title}
            </h2>
            {currentStory.recordedBy && (
              <p className="text-gray-500 mb-6">
                Read by {currentStory.recordedBy}
              </p>
            )}

            {/* Audio player */}
            {currentStory.audioUrl ? (
              <>
                <audio ref={audioRef} src={currentStory.audioUrl} />

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="w-full h-2 bg-sage-pale rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>
                      {audioRef.current
                        ? formatTime(audioRef.current.currentTime)
                        : "0:00"}
                    </span>
                    <span>
                      {audioRef.current && audioRef.current.duration
                        ? formatTime(audioRef.current.duration)
                        : "--:--"}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime -= 10;
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-sage-pale text-sage-dark hover:bg-sage-light transition-colors flex items-center justify-center"
                    aria-label="Rewind 10 seconds"
                  >
                    <span aria-hidden="true">⏪</span>
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-sage text-white hover:bg-sage-dark transition-colors flex items-center justify-center text-2xl"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    <span aria-hidden="true">{isPlaying ? "⏸️" : "▶️"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime += 10;
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-sage-pale text-sage-dark hover:bg-sage-light transition-colors flex items-center justify-center"
                    aria-label="Forward 10 seconds"
                  >
                    <span aria-hidden="true">⏩</span>
                  </button>
                </div>
              </>
            ) : (
              /* Text-only story */
              <div className="prose prose-sage max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentStory.content}
                </p>
              </div>
            )}

            {/* Sleep timer */}
            {showSleepTimer && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-3">🌙 Sleep Timer</p>
                <div className="flex gap-2 justify-center">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSleepMinutes(mins)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        sleepMinutes === mins
                          ? "bg-twilight text-white"
                          : "bg-twilight/10 text-twilight hover:bg-twilight/20"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  {sleepMinutes && (
                    <button
                      onClick={() => setSleepMinutes(null)}
                      className="px-3 py-1 rounded-full text-sm text-gray-400 hover:text-gray-600"
                    >
                      Off
                    </button>
                  )}
                </div>
                {sleepMinutes && (
                  <p className="text-center text-xs text-twilight mt-2">
                    Stories will stop in {sleepMinutes} minutes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
