"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from "@/components/ui";

interface SlideshowPhoto {
  id: string;
  url: string;
  caption?: string;
  year?: string;
  duration: number; // seconds per slide
  transition: "fade" | "slide" | "zoom" | "none";
}

interface SlideshowConfig {
  title: string;
  subtitle?: string;
  photos: SlideshowPhoto[];
  musicUrl?: string;
  musicTitle?: string;
  theme: "classic" | "modern" | "vintage" | "nature" | "elegant";
  defaultDuration: number;
  defaultTransition: SlideshowPhoto["transition"];
  showCaptions: boolean;
  autoPlay: boolean;
}

interface MemorialSlideshowMakerProps {
  deceasedName: string;
  birthYear?: string;
  deathYear?: string;
  existingPhotos?: Array<{ url: string; caption?: string; year?: string }>;
  onSave?: (config: SlideshowConfig) => void;
  onExport?: (format: "video" | "pdf" | "link") => void;
}

const themeStyles = {
  classic: {
    bg: "bg-gray-900",
    text: "text-white",
    accent: "#D4AF37",
    font: "font-serif",
    label: "Classic",
    preview: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
  },
  modern: {
    bg: "bg-slate-800",
    text: "text-white",
    accent: "#60A5FA",
    font: "font-sans",
    label: "Modern",
    preview: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
  },
  vintage: {
    bg: "bg-amber-950",
    text: "text-amber-100",
    accent: "#D97706",
    font: "font-serif",
    label: "Vintage",
    preview: "linear-gradient(135deg, #451a03 0%, #78350f 100%)",
  },
  nature: {
    bg: "bg-green-900",
    text: "text-green-50",
    accent: "#22C55E",
    font: "font-sans",
    label: "Nature",
    preview: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
  },
  elegant: {
    bg: "bg-purple-950",
    text: "text-purple-50",
    accent: "#A855F7",
    font: "font-serif",
    label: "Elegant",
    preview: "linear-gradient(135deg, #3b0764 0%, #581c87 100%)",
  },
};

const transitionOptions = [
  { value: "fade", label: "Fade", icon: "◐" },
  { value: "slide", label: "Slide", icon: "→" },
  { value: "zoom", label: "Zoom", icon: "⊕" },
  { value: "none", label: "None", icon: "□" },
];

// Sample music suggestions based on era
const musicSuggestions = [
  { title: "What a Wonderful World", artist: "Louis Armstrong", year: "1967", mood: "peaceful" },
  { title: "Unforgettable", artist: "Nat King Cole", year: "1951", mood: "romantic" },
  { title: "My Way", artist: "Frank Sinatra", year: "1969", mood: "reflective" },
  { title: "Over the Rainbow", artist: "Judy Garland", year: "1939", mood: "hopeful" },
  { title: "In My Life", artist: "The Beatles", year: "1965", mood: "nostalgic" },
  { title: "Canon in D", artist: "Pachelbel", year: "classical", mood: "elegant" },
  { title: "Amazing Grace", artist: "Traditional", year: "hymn", mood: "spiritual" },
];

// Sample photos for demo
const samplePhotos: SlideshowPhoto[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
    caption: "Summer at the lake house, 1987",
    year: "1987",
    duration: 5,
    transition: "fade",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
    caption: "Family dinner traditions",
    year: "1990s",
    duration: 5,
    transition: "fade",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800",
    caption: "The wedding day",
    year: "1963",
    duration: 6,
    transition: "zoom",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800",
    caption: "Always in our hearts",
    duration: 5,
    transition: "fade",
  },
];

export function MemorialSlideshowMaker({
  deceasedName,
  birthYear,
  deathYear,
  existingPhotos = [],
  onSave,
  onExport,
}: MemorialSlideshowMakerProps) {
  const [step, setStep] = useState<"photos" | "settings" | "preview">("photos");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [config, setConfig] = useState<SlideshowConfig>({
    title: `In Loving Memory of ${deceasedName}`,
    subtitle: birthYear && deathYear ? `${birthYear} - ${deathYear}` : undefined,
    photos: existingPhotos.length > 0
      ? existingPhotos.map((p, i) => ({
          id: String(i),
          url: p.url,
          caption: p.caption,
          year: p.year,
          duration: 5,
          transition: "fade" as const,
        }))
      : samplePhotos,
    theme: "classic",
    defaultDuration: 5,
    defaultTransition: "fade",
    showCaptions: true,
    autoPlay: true,
  });

  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-advance slides during preview
  useEffect(() => {
    if (isPlaying && config.photos.length > 0) {
      const currentPhoto = config.photos[currentSlide];
      slideIntervalRef.current = setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % config.photos.length);
      }, currentPhoto.duration * 1000);

      return () => {
        if (slideIntervalRef.current) clearTimeout(slideIntervalRef.current);
      };
    }
  }, [isPlaying, currentSlide, config.photos]);

  // Handle photo upload
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhoto: SlideshowPhoto = {
          id: Date.now().toString() + Math.random(),
          url: reader.result as string,
          duration: config.defaultDuration,
          transition: config.defaultTransition,
        };
        setConfig((prev) => ({
          ...prev,
          photos: [...prev.photos, newPhoto],
        }));
      };
      reader.readAsDataURL(file);
    });
  }, [config.defaultDuration, config.defaultTransition]);

  // Update photo
  const updatePhoto = useCallback((id: string, updates: Partial<SlideshowPhoto>) => {
    setConfig((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  // Remove photo
  const removePhoto = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  }, []);

  // Reorder photos
  const movePhoto = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const photos = [...prev.photos];
      const [removed] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, removed);
      return { ...prev, photos };
    });
  }, []);

  // Toggle fullscreen preview
  const toggleFullscreen = useCallback(() => {
    if (previewRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        previewRef.current.requestFullscreen();
      }
    }
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(config);
  }, [config, onSave]);

  // Handle export
  const handleExport = useCallback((format: "video" | "pdf" | "link") => {
    onExport?.(format);
  }, [onExport]);

  const theme = themeStyles[config.theme];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Memorial Slideshow</CardTitle>
            <CardDescription>
              Create a beautiful tribute video for {deceasedName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(["photos", "settings", "preview"] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                  step === s
                    ? "bg-sage text-white"
                    : "bg-sage-pale text-sage-dark hover:bg-sage-light"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step 1: Photo Selection */}
        {step === "photos" && (
          <div className="space-y-6">
            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">Step 1: Add Photos</h3>
              <p className="text-sm text-gray-500">
                Upload photos and arrange them in the order you want them to appear
              </p>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {config.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={photo.url.startsWith("blob:") || photo.url.startsWith("data:")}
                  />

                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="bg-white/90 text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {index > 0 && (
                        <button
                          onClick={() => movePhoto(index, index - 1)}
                          className="w-6 h-6 bg-white/90 rounded text-sm hover:bg-white"
                        >
                          ←
                        </button>
                      )}
                      {index < config.photos.length - 1 && (
                        <button
                          onClick={() => movePhoto(index, index + 1)}
                          className="w-6 h-6 bg-white/90 rounded text-sm hover:bg-white"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Caption preview */}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Add photo button */}
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-sage hover:bg-sage-pale/20 transition-colors">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">Add Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            {/* Photo Details Editor */}
            {config.photos.length > 0 && (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium text-sage-dark">Photo Details</h4>
                {config.photos.map((photo) => (
                  <div key={photo.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                    <Image
                      src={photo.url}
                      alt=""
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded"
                      unoptimized={photo.url.startsWith("blob:") || photo.url.startsWith("data:")}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={photo.caption || ""}
                        onChange={(e) => updatePhoto(photo.id, { caption: e.target.value })}
                        placeholder="Caption"
                        className="text-sm"
                      />
                      <Input
                        value={photo.year || ""}
                        onChange={(e) => updatePhoto(photo.id, { year: e.target.value })}
                        placeholder="Year"
                        className="text-sm"
                      />
                    </div>
                    <select
                      value={photo.duration}
                      onChange={(e) => updatePhoto(photo.id, { duration: Number(e.target.value) })}
                      className="text-sm border rounded p-1"
                    >
                      {[3, 4, 5, 6, 7, 8, 10].map((d) => (
                        <option key={d} value={d}>{d}s</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Next button */}
            <div className="flex justify-end">
              <Button onClick={() => setStep("settings")} disabled={config.photos.length === 0}>
                Next: Settings →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === "settings" && (
          <div className="space-y-6">
            <div className="bg-sage-pale/30 rounded-lg p-4">
              <h3 className="font-medium text-sage-dark mb-2">Step 2: Customize</h3>
              <p className="text-sm text-gray-500">
                Choose your theme, music, and slideshow settings
              </p>
            </div>

            {/* Title & Subtitle */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Slideshow Title</label>
                <Input
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="In Loving Memory..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Subtitle</label>
                <Input
                  value={config.subtitle || ""}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  placeholder="1942 - 2023"
                />
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Theme</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(themeStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setConfig({ ...config, theme: key as SlideshowConfig["theme"] })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      config.theme === key
                        ? "border-sage ring-2 ring-sage ring-offset-2"
                        : "border-gray-200 hover:border-sage-light"
                    }`}
                    style={{ background: style.preview }}
                  >
                    <span className={`${style.text} ${style.font}`}>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Transition */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Default Transition</label>
              <div className="flex gap-2">
                {transitionOptions.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setConfig({ ...config, defaultTransition: value as SlideshowPhoto["transition"] })}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      config.defaultTransition === value
                        ? "bg-sage text-white border-sage"
                        : "bg-white text-gray-600 border-gray-200 hover:border-sage"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Music Selection */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Background Music (Optional)</label>
              <div className="space-y-3">
                <Input
                  value={config.musicTitle || ""}
                  onChange={(e) => setConfig({ ...config, musicTitle: e.target.value })}
                  placeholder="Song title or paste audio URL"
                />
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Popular memorial songs:</p>
                  <div className="flex flex-wrap gap-2">
                    {musicSuggestions.slice(0, 5).map((song) => (
                      <button
                        key={song.title}
                        onClick={() => setConfig({ ...config, musicTitle: `${song.title} - ${song.artist}` })}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          config.musicTitle?.includes(song.title)
                            ? "bg-sage text-white"
                            : "bg-white text-gray-600 hover:bg-sage-pale"
                        }`}
                      >
                        🎵 {song.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCaptions}
                  onChange={(e) => setConfig({ ...config, showCaptions: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="text-sm text-gray-600">Show captions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoPlay}
                  onChange={(e) => setConfig({ ...config, autoPlay: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="text-sm text-gray-600">Auto-play on load</span>
              </label>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("photos")}>
                ← Back
              </Button>
              <Button onClick={() => { setStep("preview"); setIsPlaying(true); setCurrentSlide(0); }}>
                Preview Slideshow →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Preview Window */}
            <div
              ref={previewRef}
              className={`relative aspect-video rounded-lg overflow-hidden ${theme.bg}`}
            >
              {config.photos.length > 0 && (
                <>
                  {/* Current slide */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      config.photos[currentSlide].transition === "fade" ? "ease-in-out" : ""
                    }`}
                  >
                    <Image
                      src={config.photos[currentSlide].url}
                      alt=""
                      fill
                      className={`object-cover ${
                        config.photos[currentSlide].transition === "zoom"
                          ? "animate-slow-zoom"
                          : ""
                      }`}
                      unoptimized={config.photos[currentSlide].url.startsWith("blob:") || config.photos[currentSlide].url.startsWith("data:")}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                    {/* Title (first slide) */}
                    {currentSlide === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <h2 className={`text-3xl md:text-4xl ${theme.text} ${theme.font} mb-2`}>
                          {config.title}
                        </h2>
                        {config.subtitle && (
                          <p className={`text-lg ${theme.text} opacity-80`}>{config.subtitle}</p>
                        )}
                      </div>
                    )}

                    {/* Caption */}
                    {config.showCaptions && config.photos[currentSlide].caption && currentSlide > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className={`text-center ${theme.text} ${theme.font}`}>
                          {config.photos[currentSlide].caption}
                        </p>
                        {config.photos[currentSlide].year && (
                          <p className={`text-center text-sm ${theme.text} opacity-70 mt-1`}>
                            {config.photos[currentSlide].year}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${((currentSlide + 1) / config.photos.length) * 100}%`,
                        backgroundColor: theme.accent,
                      }}
                    />
                  </div>

                  {/* Slide counter */}
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/50 rounded text-white text-sm">
                    {currentSlide + 1} / {config.photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                className="w-10 h-10 rounded-full bg-sage-pale text-sage-dark hover:bg-sage-light flex items-center justify-center"
                disabled={currentSlide === 0}
              >
                ⏮
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-sage text-white hover:bg-sage-dark flex items-center justify-center text-xl"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => Math.min(config.photos.length - 1, prev + 1))}
                className="w-10 h-10 rounded-full bg-sage-pale text-sage-dark hover:bg-sage-light flex items-center justify-center"
                disabled={currentSlide === config.photos.length - 1}
              >
                ⏭
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-sage-pale text-sage-dark hover:bg-sage-light flex items-center justify-center ml-4"
                title="Fullscreen"
              >
                ⛶
              </button>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto py-2">
              {config.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => { setCurrentSlide(index); setIsPlaying(false); }}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                    currentSlide === index ? "border-sage" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={photo.url} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized={photo.url.startsWith("blob:") || photo.url.startsWith("data:")} />
                </button>
              ))}
            </div>

            {/* Export Options */}
            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
              <Button variant="outline" onClick={() => handleExport("link")}>
                🔗 Share Link
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                📄 Export PDF
              </Button>
              <Button onClick={() => handleExport("video")}>
                🎬 Export Video
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("settings")}>
                ← Edit Settings
              </Button>
              <Button onClick={handleSave}>
                Save Slideshow
              </Button>
            </div>
          </div>
        )}

        {/* Total duration info */}
        {config.photos.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              {config.photos.length} photos • Total duration: {config.photos.reduce((sum, p) => sum + p.duration, 0)} seconds
            </p>
          </div>
        )}
      </CardContent>

      {/* CSS for zoom animation */}
      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 5s ease-in-out forwards;
        }
      `}</style>
    </Card>
  );
}
