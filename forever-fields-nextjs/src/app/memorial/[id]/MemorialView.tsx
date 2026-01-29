"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { MemoryAssistant, LegacyCompanion } from "@/components/ai";
import { KidsMemorialExplorer, StoryTime, MilestoneMessages, MySpaceForGrandma } from "@/components/kids";
import { QRMemorialCode, SimpleFamilyTree, LivingPortrait, TraditionsLegacy, MusicGallery, TraditionEditor, MusicEditor } from "@/components/memorial";
import { GraveLocator } from "@/components/memorial/GraveLocator";
import { formatDate, calculateAge } from "@/lib/utils";
import {
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Copy,
  Facebook,
  Twitter,
  MessageCircle,
  Linkedin,
  Mail,
  Flame,
  Camera,
  Users,
  MapPin,
  Quote,
  Sparkles,
  QrCode,
  Navigation,
  Shield,
  Mic,
  Image as ImageIcon,
  Gift,
  Video,
  Palette,
  Check,
  Leaf,
  Scroll,
  Waves,
  Sun,
  Flower2,
  type LucideIcon,
} from "lucide-react";

// Theme definitions - personality-based options
const MEMORIAL_THEMES: Record<string, {
  name: string;
  description: string;
  icon: LucideIcon;
  heroOverlay: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  cardGradient: string;
}> = {
  garden: {
    name: "Garden",
    description: "Nature-inspired with soft greens",
    icon: Leaf,
    heroOverlay: "from-emerald-900/80 via-emerald-800/40 to-emerald-700/20",
    accentColor: "text-emerald-400",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    cardGradient: "from-emerald-50 to-sage-pale",
  },
  classic: {
    name: "Classic",
    description: "Timeless sepia tones",
    icon: Scroll,
    heroOverlay: "from-amber-900/80 via-amber-800/40 to-amber-700/20",
    accentColor: "text-amber-300",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    cardGradient: "from-amber-50 to-orange-50",
  },
  ocean: {
    name: "Ocean",
    description: "Peaceful blue waters",
    icon: Waves,
    heroOverlay: "from-blue-900/80 via-blue-800/40 to-cyan-700/20",
    accentColor: "text-cyan-300",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    cardGradient: "from-blue-50 to-cyan-50",
  },
  sunset: {
    name: "Sunset",
    description: "Warm golden hour",
    icon: Sun,
    heroOverlay: "from-orange-900/80 via-rose-800/40 to-amber-700/20",
    accentColor: "text-orange-300",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
    cardGradient: "from-orange-50 to-rose-50",
  },
  night: {
    name: "Starlight",
    description: "Peaceful night sky",
    icon: Sparkles,
    heroOverlay: "from-slate-900/90 via-indigo-900/50 to-purple-900/30",
    accentColor: "text-indigo-300",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-800",
    cardGradient: "from-slate-100 to-indigo-50",
  },
  rose: {
    name: "Rose Garden",
    description: "Romantic pink florals",
    icon: Flower2,
    heroOverlay: "from-rose-900/80 via-pink-800/40 to-rose-700/20",
    accentColor: "text-rose-300",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    cardGradient: "from-rose-50 to-pink-50",
  },
};

type ThemeKey = keyof typeof MEMORIAL_THEMES;

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  theme: string;
  isPublic: boolean;
  settings: Record<string, unknown>;
  user: {
    id: string;
    name: string | null;
  };
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
    takenAt: string | null;
  }>;
  memories: Array<{
    id: string;
    content: string;
    authorName: string;
    relationship: string | null;
    createdAt: string;
  }>;
  candles: Array<{
    id: string;
    message: string | null;
    lighterName: string | null;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
  }>;
  traditions?: Array<{
    id: string;
    type: "recipe" | "wisdom" | "skill" | "tradition" | "saying";
    title: string;
    content: string;
    ingredients?: string[];
    occasion?: string;
    memory?: string;
    addedBy: string;
  }>;
  favorites?: Array<{
    id: string;
    songTitle: string;
    artist: string;
    genre?: string;
    significance?: string;
    addedBy: string;
  }>;
}

interface MemorialViewProps {
  memorial: Memorial;
  userRole?: "owner" | "editor" | "viewer" | "guest";
}

// Types for editors
interface Tradition {
  id: string;
  type: "recipe" | "wisdom" | "skill" | "tradition" | "saying";
  title: string;
  content: string;
  ingredients?: string[];
  occasion?: string;
  memory?: string;
  addedBy: string;
}

interface FavoriteMusic {
  id: string;
  songTitle: string;
  artist: string;
  genre?: string;
  significance?: string;
  addedBy: string;
}

type ViewMode = "default" | "kids" | "companion" | "stories" | "milestones" | "create";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export function MemorialView({ memorial, userRole = "owner" }: MemorialViewProps) {
  const [activeTab, setActiveTab] = useState<"memories" | "photos" | "timeline" | "family" | "candles" | "traditions" | "music">("memories");
  const [showMemoryAssistant, setShowMemoryAssistant] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showGraveLocator, setShowGraveLocator] = useState(false);

  // Permission check - owners and editors can edit content
  const canEdit = userRole === "owner" || userRole === "editor";

  // Editor modal states
  const [showTraditionEditor, setShowTraditionEditor] = useState(false);
  const [editingTradition, setEditingTradition] = useState<Tradition | null>(null);
  const [showMusicEditor, setShowMusicEditor] = useState(false);
  const [editingMusic, setEditingMusic] = useState<FavoriteMusic | null>(null);

  // Local state for traditions and music (for demo mode - would be from API in production)
  const [traditions, setTraditions] = useState<Tradition[]>(memorial.traditions || []);
  const [favorites, setFavorites] = useState<FavoriteMusic[]>(memorial.favorites || []);

  // Theme state - default to garden theme
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>((memorial.theme as ThemeKey) || "garden");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const theme = MEMORIAL_THEMES[currentTheme];

  // Living Portrait state
  const [livingPortraitUrl, setLivingPortraitUrl] = useState<string | null>(
    (memorial.settings?.livingPortraitUrl as string) || null
  );
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // Candle modal state
  const [showCandleModal, setShowCandleModal] = useState(false);
  const [candleMessage, setCandleMessage] = useState("");
  const [candleName, setCandleName] = useState("");

  const fullName = `${memorial.firstName} ${memorial.lastName}`;
  const age = memorial.birthDate && memorial.deathDate
    ? calculateAge(memorial.birthDate, memorial.deathDate)
    : null;

  // Featured quote - pull from first memory or use default
  const featuredQuote = memorial.memories.length > 0
    ? {
        text: memorial.memories[0].content.length > 150
          ? memorial.memories[0].content.slice(0, 150) + "..."
          : memorial.memories[0].content,
        author: memorial.memories[0].authorName,
        relationship: memorial.memories[0].relationship,
      }
    : null;

  // "Who They Were" personality traits - would come from memorial settings
  const personalityTraits = [
    { icon: "☕", label: "Morning coffee ritual" },
    { icon: "🎹", label: "Piano every Sunday" },
    { icon: "📚", label: "Romance novels" },
    { icon: "🍪", label: "Famous cookies" },
    { icon: "🌹", label: "Rose garden" },
    { icon: "👨‍👩‍👧‍👦", label: `${memorial.memories.length || 0} memories shared` },
  ];

  // Engagement stats
  const engagementStats = {
    candles: memorial.candles.length,
    memories: memorial.memories.length,
    photos: memorial.photos.length,
    familyMembers: 12, // Would come from collaborators count
  };

  // Recent activity for "Living Memorial" indicator
  const recentActivity = memorial.candles.length > 0
    ? {
        action: "lit a candle",
        name: memorial.candles[memorial.candles.length - 1].lighterName || "Someone",
        timeAgo: "recently",
      }
    : memorial.memories.length > 0
    ? {
        action: "shared a memory",
        name: memorial.memories[memorial.memories.length - 1].authorName,
        timeAgo: "recently",
      }
    : null;

  // Build ancestor profile for AI features
  const ancestorProfile = {
    id: memorial.id,
    firstName: memorial.firstName,
    lastName: memorial.lastName,
    name: fullName,
    relationship: "loved one", // Would come from viewer context
    birthYear: memorial.birthDate ? new Date(memorial.birthDate).getFullYear().toString() : undefined,
    deathYear: memorial.deathDate ? new Date(memorial.deathDate).getFullYear().toString() : undefined,
    profilePhotoUrl: memorial.profilePhotoUrl || undefined,
    biography: memorial.biography || undefined,
    hasLegacyData: memorial.memories.length > 0,
    favoriteThings: [
      { icon: "❤️", label: "Family" },
      { icon: "🌻", label: "Nature" },
      { icon: "📚", label: "Stories" },
      { icon: "🍪", label: "Baking" },
    ],
    stories: memorial.memories.map(m => ({
      id: m.id,
      title: `Memory from ${m.authorName}`,
      content: m.content,
      recordedBy: m.authorName,
    })),
    wisdom: [
      "Love fiercely and forgive quickly.",
      "Family is everything.",
      "You can do hard things.",
    ],
  };

  // Sample milestone messages (would come from database)
  const milestoneMessages = [
    {
      id: "1",
      title: "For Your 18th Birthday",
      occasion: "18th Birthday",
      unlockAge: 18,
      content: "My dear, on this special day as you become an adult, I want you to know how proud I am of the person you've become. Always remember where you come from and the love that surrounds you.",
      fromName: "Family",
      fromRelationship: "your family",
      writtenInSpiritOf: memorial.firstName,
      isUnlocked: false,
    },
    {
      id: "2",
      title: "For Your Wedding Day",
      occasion: "Wedding",
      content: "On your wedding day, know that I am there in spirit, watching you begin this beautiful journey. Love is patient, love is kind. Cherish each other always.",
      fromName: "Family",
      fromRelationship: "your family",
      writtenInSpiritOf: memorial.firstName,
      isUnlocked: false,
    },
  ];

  // Lightbox navigation
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % memorial.photos.length);
  }, [memorial.photos.length]);

  const prevPhoto = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + memorial.photos.length) % memorial.photos.length);
  }, [memorial.photos.length]);

  // Share URL - use state to avoid hydration mismatch
  const [shareUrl, setShareUrl] = useState(`/memorial/${memorial.slug}`);

  useEffect(() => {
    // Update to actual URL after mount to avoid hydration issues
    setShareUrl(window.location.href);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareToTwitter = () => {
    const text = `Remembering ${fullName} - Forever Fields Memorial`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = `Remembering ${fullName} - View their memorial: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = `Remembering ${fullName} - Forever Fields Memorial`;
    const body = `I wanted to share this memorial with you:\n\n${fullName}\n\nView the memorial: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Memorial`,
          text: `Remembering ${fullName}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Light a candle
  const handleLightCandle = () => {
    if (!candleName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    // TODO: POST to /api/memorials/:id/candles
    toast.success("Candle lit in loving memory");
    setShowCandleModal(false);
    setCandleMessage("");
    setCandleName("");
  };

  // Tradition handlers
  const handleAddTradition = () => {
    setEditingTradition(null);
    setShowTraditionEditor(true);
  };

  const handleEditTradition = (tradition: Tradition) => {
    setEditingTradition(tradition);
    setShowTraditionEditor(true);
  };

  const handleSaveTradition = (traditionData: Omit<Tradition, "id"> & { id?: string }) => {
    if (traditionData.id) {
      // Update existing
      setTraditions((prev) =>
        prev.map((t) => (t.id === traditionData.id ? { ...t, ...traditionData } as Tradition : t))
      );
      toast.success("Tradition updated!");
    } else {
      // Add new
      const newTradition: Tradition = {
        ...traditionData,
        id: `tradition-${Date.now()}`,
      } as Tradition;
      setTraditions((prev) => [...prev, newTradition]);
      toast.success("Tradition added!");
    }
    setShowTraditionEditor(false);
    setEditingTradition(null);
  };

  const handleDeleteTradition = (id: string) => {
    setTraditions((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tradition removed");
  };

  // Music handlers
  const handleAddMusic = () => {
    setEditingMusic(null);
    setShowMusicEditor(true);
  };

  const handleEditMusic = (music: FavoriteMusic) => {
    setEditingMusic(music);
    setShowMusicEditor(true);
  };

  const handleSaveMusic = (musicData: Omit<FavoriteMusic, "id"> & { id?: string }) => {
    if (musicData.id) {
      // Update existing
      setFavorites((prev) =>
        prev.map((m) => (m.id === musicData.id ? { ...m, ...musicData } as FavoriteMusic : m))
      );
      toast.success("Song updated!");
    } else {
      // Add new
      const newMusic: FavoriteMusic = {
        ...musicData,
        id: `music-${Date.now()}`,
      } as FavoriteMusic;
      setFavorites((prev) => [...prev, newMusic]);
      toast.success("Song added!");
    }
    setShowMusicEditor(false);
    setEditingMusic(null);
  };

  const handleDeleteMusic = (id: string) => {
    setFavorites((prev) => prev.filter((m) => m.id !== id));
    toast.success("Song removed");
  };

  // Generate Living Portrait
  const handleGenerateLivingPortrait = async () => {
    if (!memorial.profilePhotoUrl) {
      toast.error("No profile photo to animate");
      return;
    }

    if (isGeneratingPortrait) {
      toast.info("Already generating, please wait...");
      return;
    }

    setIsGeneratingPortrait(true);
    toast.info("Creating Living Portrait... This may take 30-60 seconds.", {
      duration: 10000,
    });

    try {
      const response = await fetch("/api/ai/living-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: memorial.profilePhotoUrl,
          motionBucketId: 40, // Subtle motion
        }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setLivingPortraitUrl(data.videoUrl);
        toast.success("Living Portrait created! Click play to see it.");
      } else {
        throw new Error(data.error || "Failed to generate");
      }
    } catch (error) {
      console.error("Living portrait error:", error);
      toast.error("Failed to create Living Portrait. Please try again.");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  // Kids Explorer Mode
  if (viewMode === "kids") {
    return (
      <div>
        <button
          onClick={() => setViewMode("default")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Memorial
        </button>
        <KidsMemorialExplorer
          ancestor={ancestorProfile}
          onAgeSelected={(age) => console.log("Age selected:", age)}
        />
      </div>
    );
  }

  // Legacy Companion Mode
  if (viewMode === "companion") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setViewMode("default")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Memorial
        </button>
        <LegacyCompanion
          profile={{
            name: fullName,
            relationship: "loved one",
            birthYear: ancestorProfile.birthYear,
            deathYear: ancestorProfile.deathYear,
            profilePhotoUrl: memorial.profilePhotoUrl || undefined,
            biography: memorial.biography || undefined,
            memories: memorial.memories.map(m => m.content),
            phrases: ancestorProfile.wisdom,
          }}
          userRelationship="family member"
        />
      </div>
    );
  }

  // Story Time Mode
  if (viewMode === "stories") {
    return (
      <div>
        <button
          onClick={() => setViewMode("default")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Memorial
        </button>
        <StoryTime
          ancestorName={memorial.firstName}
          ancestorPhoto={memorial.profilePhotoUrl || undefined}
          stories={ancestorProfile.stories}
          onRecordStory={() => toast.info("Voice recording coming soon!")}
        />
      </div>
    );
  }

  // Milestone Messages Mode
  if (viewMode === "milestones") {
    return (
      <div>
        <button
          onClick={() => setViewMode("default")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Memorial
        </button>
        <MilestoneMessages
          recipientName="You"
          ancestorName={memorial.firstName}
          ancestorPhoto={memorial.profilePhotoUrl || undefined}
          messages={milestoneMessages}
          onCreateMessage={() => toast.info("Create message feature coming soon!")}
        />
      </div>
    );
  }

  // Create for Grandma Mode
  if (viewMode === "create") {
    return (
      <div>
        <button
          onClick={() => setViewMode("default")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Memorial
        </button>
        <MySpaceForGrandma
          ancestorName={memorial.firstName}
          ancestorPhoto={memorial.profilePhotoUrl || undefined}
          creatorName="Visitor"
          creations={[]}
          onSave={(creation) => {
            console.log("Saving creation:", creation);
            toast.success("Saved! (Demo mode)");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Cinematic Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] max-h-[700px] bg-sage-dark overflow-hidden">
        {/* Background Photo with Ken Burns effect */}
        {memorial.coverPhotoUrl ? (
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={memorial.coverPhotoUrl}
              alt={`Cover photo for ${fullName}`}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sage via-sage-dark to-gray-900" />
        )}

        {/* Gradient overlays for text readability - themed */}
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroOverlay}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Share & Theme Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setShowThemeSelector(true)}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Theme</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleNativeShare}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </motion.button>
        </div>

        {/* Living Memorial Indicator */}
        {recentActivity && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute top-4 left-4 z-20"
          >
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-700">
                {recentActivity.name} {recentActivity.action} {recentActivity.timeAgo}
              </span>
            </div>
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-10">
          <div className="max-w-4xl mx-auto w-full">
            {/* Featured Quote */}
            {featuredQuote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  <Quote className="w-8 h-8 text-gold/80 shrink-0 mt-1" />
                  <div>
                    <p className="text-white/90 text-lg md:text-xl italic leading-relaxed">
                      &ldquo;{featuredQuote.text}&rdquo;
                    </p>
                    <p className="text-white/60 text-sm mt-2">
                      — {featuredQuote.author}{featuredQuote.relationship && `, ${featuredQuote.relationship}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Profile Photo + Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col md:flex-row items-center md:items-end gap-6"
            >
              {/* Living Portrait - AI-animated profile photo */}
              {memorial.profilePhotoUrl ? (
                <LivingPortrait
                  imageUrl={memorial.profilePhotoUrl}
                  videoUrl={livingPortraitUrl}
                  name={fullName}
                  size="lg"
                  showControls={true}
                  isGenerating={isGeneratingPortrait}
                  onGenerateRequest={handleGenerateLivingPortrait}
                  betaMode={true} // Opt-in beta testing
                />
              ) : (
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white/90 shadow-2xl overflow-hidden bg-sage-pale flex items-center justify-center text-sage-dark text-4xl font-serif bg-gradient-to-br from-sage-pale to-sage-light">
                  {memorial.firstName[0]}{memorial.lastName[0]}
                </div>
              )}

              {/* Name & Life Span */}
              <div className="text-center md:text-left">
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-bold tracking-tight">
                  {fullName}
                </h1>
                <p className="text-white/80 text-lg md:text-xl mt-2">
                  {memorial.birthDate && new Date(memorial.birthDate).getFullYear()}
                  {memorial.birthDate && memorial.deathDate && " – "}
                  {memorial.deathDate && new Date(memorial.deathDate).getFullYear()}
                  {age && (
                    <span className={`ml-3 ${theme.accentColor}`}>
                      · {age} years of love
                    </span>
                  )}
                </p>
              </div>
            </motion.div>

            {/* Engagement Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 md:gap-6 mt-6"
            >
              <div className="flex items-center gap-2 text-white/80">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-sm md:text-base">{engagementStats.candles} candles lit</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-sm md:text-base">{engagementStats.photos} photos</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm md:text-base">{engagementStats.memories} memories</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm md:text-base">{engagementStats.familyMembers} family members</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* "Who They Were" Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${theme.cardGradient} border-b border-sage-pale/30`}>
              <CardTitle className="flex items-center gap-2 text-sage-dark">
                <Sparkles className="w-5 h-5 text-gold" />
                What Made {memorial.firstName} Special
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {personalityTraits.map((trait, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-sage-pale/30 hover:bg-sage-pale/50 transition-colors"
                  >
                    <span className="text-2xl">{trait.icon}</span>
                    <span className="text-sm text-gray-700">{trait.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Philosophy/Quote if exists */}
              {memorial.biography && (
                <div className="mt-6 p-4 border-l-4 border-gold bg-gold/5 rounded-r-lg">
                  <p className="text-gray-700 italic">
                    {memorial.biography.length > 200
                      ? memorial.biography.slice(0, 200) + "..."
                      : memorial.biography}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions - Primary CTAs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            onClick={() => setShowCandleModal(true)}
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white"
          >
            <Flame className="w-4 h-4 mr-2" />
            Light a Candle
          </Button>
          <Button variant="outline" onClick={() => setShowMemoryAssistant(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Share a Memory
          </Button>
          <Button variant="outline" onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Memorial
          </Button>
        </div>

        {/* Interactive Experiences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-serif text-xl text-sage-dark mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Interactive Experiences
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setViewMode("companion")}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all text-center group border border-purple-200"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💬</span>
              <span className="text-sm font-medium text-purple-900">Talk to {memorial.firstName}</span>
              <span className="text-xs text-purple-600 block">AI companion</span>
            </button>

            <button
              onClick={() => setViewMode("stories")}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all text-center group border border-blue-200"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🎧</span>
              <span className="text-sm font-medium text-blue-900">Story Time</span>
              <span className="text-xs text-blue-600 block">Listen to memories</span>
            </button>

            <button
              onClick={() => setViewMode("milestones")}
              className="p-4 bg-gradient-to-br from-gold/20 to-gold/30 hover:from-gold/30 hover:to-gold/40 rounded-xl transition-all text-center group border border-gold/30"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💌</span>
              <span className="text-sm font-medium text-amber-900">Time Capsule</span>
              <span className="text-xs text-amber-700 block">Future messages</span>
            </button>

            <button
              onClick={() => setViewMode("kids")}
              className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 rounded-xl transition-all text-center group border border-pink-200"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🧒</span>
              <span className="text-sm font-medium text-pink-900">For Children</span>
              <span className="text-xs text-pink-600 block">Age-appropriate</span>
            </button>
          </div>
        </motion.div>

        {/* Physical Connection & Preservation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-serif text-xl text-sage-dark mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sage" />
            Physical Connection
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* QR Code */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowQRModal(true)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sage-pale flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-dark">QR Code</h3>
                    <p className="text-sm text-gray-500">Print for headstone, programs, or memorial cards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grave Locator */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowGraveLocator(true)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Navigation className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-dark">Find Their Resting Place</h3>
                    <p className="text-sm text-gray-500">GPS navigation to the exact location</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permanence */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900">Preserved Forever</h3>
                    <p className="text-sm text-amber-700">Blockchain-backed 200+ year guarantee</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* AI Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-serif text-xl text-sage-dark mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-dark">Voice Clone</span>
                <span className="text-xs text-gray-500">Hear them again</span>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-dark">Photo Restore</span>
                <span className="text-xs text-gray-500">Enhance old photos</span>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-dark">Animate Photo</span>
                <span className="text-xs text-gray-500">Bring photos to life</span>
              </div>
            </Card>

            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setViewMode("create")}>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Gift className="w-5 h-5 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-gray-dark">Create Art</span>
                <span className="text-xs text-gray-500">Draw, write, record</span>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-8 border-b border-sage-light overflow-x-auto">
          {(["memories", "photos", "timeline", "family", "candles", "traditions", "music"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "text-sage-dark border-b-2 border-sage-dark"
                  : "text-gray-500 hover:text-sage"
              }`}
            >
              {tab}
              {tab === "memories" && memorial.memories.length > 0 && (
                <span className="ml-2 text-sm bg-sage-pale text-sage-dark px-2 py-0.5 rounded-full">
                  {memorial.memories.length}
                </span>
              )}
              {tab === "candles" && memorial.candles.length > 0 && (
                <span className="ml-2 text-sm bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                  {memorial.candles.length}
                </span>
              )}
              {tab === "traditions" && traditions.length > 0 && (
                <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {traditions.length}
                </span>
              )}
              {tab === "music" && favorites.length > 0 && (
                <span className="ml-2 text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {/* Memories Tab */}
          {activeTab === "memories" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl text-sage-dark">
                  Shared Memories
                </h2>
                <Button onClick={() => setShowMemoryAssistant(true)}>
                  Share a Memory
                </Button>
              </div>

              {showMemoryAssistant && (
                <Card className="border-sage">
                  <CardHeader>
                    <CardTitle>Write a Memory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MemoryAssistant
                      deceasedName={memorial.firstName}
                      onSave={(text) => {
                        console.log("Memory to save:", text);
                        // TODO: POST to /api/memorials/:id/memories
                        toast.success("Memory saved! (Demo mode)");
                        setShowMemoryAssistant(false);
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {memorial.memories.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">
                      No memories shared yet. Be the first to share a cherished moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                memorial.memories.map((memory) => (
                  <Card key={memory.id}>
                    <CardContent className="pt-6">
                      <p className="text-gray-700 whitespace-pre-line mb-4">
                        {memory.content}
                      </p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          — {memory.authorName}
                          {memory.relationship && `, ${memory.relationship}`}
                        </span>
                        <span>{formatDate(memory.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <h2 className="font-display text-2xl text-sage-dark mb-6">
                Photo Gallery
              </h2>
              {memorial.photos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">
                      No photos uploaded yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {memorial.photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      variants={scaleIn}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => openLightbox(index)}
                      className="aspect-square rounded-lg overflow-hidden bg-sage-pale relative group cursor-pointer"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || "Memorial photo"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm">{photo.caption}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div>
              <h2 className="font-display text-2xl text-sage-dark mb-6">
                Life Timeline
              </h2>
              {memorial.events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">
                      No timeline events added yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative border-l-2 border-sage-light pl-8 space-y-8">
                  {memorial.events
                    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                    .map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-10 w-4 h-4 rounded-full bg-sage border-2 border-cream" />
                        <div className="text-sm text-sage font-medium mb-1">
                          {formatDate(event.eventDate)}
                        </div>
                        <h3 className="font-display text-xl text-sage-dark">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Family Tab */}
          {activeTab === "family" && (
            <div>
              <h2 className="font-display text-2xl text-sage-dark mb-6">
                Family Tree
              </h2>
              <SimpleFamilyTree
                people={[
                  {
                    id: memorial.id,
                    name: fullName,
                    birthYear: ancestorProfile.birthYear,
                    deathYear: ancestorProfile.deathYear,
                    photoUrl: memorial.profilePhotoUrl || undefined,
                    memorialId: memorial.id,
                    isDeceased: true,
                    relationship: "Featured",
                  },
                  // Family members would come from database
                  // For demo, showing placeholder message
                ]}
                rootPersonId={memorial.id}
                onPersonClick={(personId) => {
                  console.log("Clicked person:", personId);
                  // Navigate to their memorial if they have one
                }}
              />
              <Card className="mt-6 bg-sage-pale/30 border-0">
                <CardContent className="py-4 text-center">
                  <p className="text-gray-600 mb-3">
                    Connect family members to build out the family tree.
                    Link to other memorials to see the complete lineage.
                  </p>
                  <Button variant="outline" size="sm">
                    Add Family Member
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Candles Tab */}
          {activeTab === "candles" && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-sage-dark">
                  Virtual Candles
                </h2>
                <Button variant="secondary" onClick={() => setShowCandleModal(true)}>
                  <Heart className="w-4 h-4 mr-2" />
                  Light a Candle
                </Button>
              </div>

              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4"
              >
                {memorial.candles.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-gray-500">
                          Be the first to light a candle in remembrance.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setShowCandleModal(true)}
                        >
                          Light the First Candle
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  memorial.candles.map((candle) => (
                    <motion.div
                      key={candle.id}
                      variants={scaleIn}
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center group cursor-pointer"
                      title={candle.message || `Lit by ${candle.lighterName || "Anonymous"}`}
                    >
                      <div className="text-4xl animate-pulse">🕯️</div>
                      <span className="text-xs text-gray-500 mt-1 truncate max-w-full">
                        {candle.lighterName || "Anonymous"}
                      </span>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Traditions Tab */}
          {activeTab === "traditions" && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <h2 className="font-display text-2xl text-sage-dark mb-6">
                Traditions & Legacy
              </h2>
              <TraditionsLegacy
                traditions={traditions}
                name={memorial.firstName}
                canEdit={canEdit}
                onAdd={handleAddTradition}
                onEdit={handleEditTradition}
                onDelete={handleDeleteTradition}
              />
            </motion.div>
          )}

          {/* Music Tab */}
          {activeTab === "music" && (
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <h2 className="font-display text-2xl text-sage-dark mb-6">
                Favorite Music
              </h2>
              <MusicGallery
                favorites={favorites}
                name={memorial.firstName}
                canEdit={canEdit}
                onAdd={handleAddMusic}
                onEdit={handleEditMusic}
                onDelete={handleDeleteMusic}
              />
            </motion.div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="mt-8 mb-12">
          <QRMemorialCode
            memorialId={memorial.id}
            memorialUrl={shareUrl}
            deceasedName={fullName}
            profilePhotoUrl={memorial.profilePhotoUrl || undefined}
            birthYear={ancestorProfile.birthYear}
            deathYear={ancestorProfile.deathYear}
            showDownloadOptions={true}
          />
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && memorial.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Previous button */}
            {memorial.photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/20 rounded-full"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl max-h-[80vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={memorial.photos[lightboxIndex].url}
                alt={memorial.photos[lightboxIndex].caption || "Memorial photo"}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto object-contain"
              />
              {memorial.photos[lightboxIndex].caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-center">{memorial.photos[lightboxIndex].caption}</p>
                </div>
              )}
            </motion.div>

            {/* Next button */}
            {memorial.photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/20 rounded-full"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {lightboxIndex + 1} / {memorial.photos.length}
            </div>

            {/* Download button */}
            <a
              href={memorial.photos[lightboxIndex].url}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 text-white/80 hover:text-white p-2 bg-black/20 rounded-full"
            >
              <Download className="w-6 h-6" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-xl text-sage-dark">Share Memorial</h3>
                <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Share {fullName}&apos;s memorial with family and friends.
              </p>

              <div className="space-y-2">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-sage-pale/30 transition-colors"
                >
                  <Copy className="w-5 h-5 text-sage" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-green-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-sage-pale/30 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span>Send via Email</span>
                </button>

                <div className="flex gap-2 pt-2 border-t border-sage-pale/50">
                  <button
                    onClick={shareToFacebook}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-sage-pale hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </button>

                  <button
                    onClick={shareToTwitter}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-sage-pale hover:bg-sky-50 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                  </button>

                  <button
                    onClick={shareToLinkedIn}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-sage-pale hover:bg-blue-50 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light a Candle Modal */}
      <AnimatePresence>
        {showCandleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCandleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-pulse">🕯️</div>
                <h3 className="font-display text-xl text-sage-dark">Light a Candle</h3>
                <p className="text-gray-600 text-sm mt-1">
                  In loving memory of {memorial.firstName}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={candleName}
                    onChange={(e) => setCandleName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={candleMessage}
                    onChange={(e) => setCandleMessage(e.target.value)}
                    placeholder="Share a thought or memory..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCandleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleLightCandle}>
                    <Heart className="w-4 h-4 mr-2" />
                    Light Candle
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-xl text-sage-dark">QR Memorial Code</h3>
                <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <QRMemorialCode
                memorialId={memorial.id}
                memorialUrl={shareUrl}
                deceasedName={fullName}
                profilePhotoUrl={memorial.profilePhotoUrl || undefined}
                birthYear={ancestorProfile.birthYear}
                deathYear={ancestorProfile.deathYear}
                showDownloadOptions={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grave Locator Modal */}
      <AnimatePresence>
        {showGraveLocator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowGraveLocator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-xl text-sage-dark">Find Resting Place</h3>
                <button onClick={() => setShowGraveLocator(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <GraveLocator
                location={{
                  deceasedName: fullName,
                  cemeteryName: "Greenwood Cemetery",
                  cemeteryAddress: "500 25th Street",
                  cemeteryCity: "Brooklyn",
                  cemeteryState: "NY",
                  section: "Section B",
                  plot: "Row 12, Plot 45",
                  gpsLat: 40.7589,
                  gpsLng: -73.9851,
                  epitaph: "Forever in our hearts",
                }}
                onVisitLogged={(visit) => {
                  console.log("Visit logged:", visit);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-serif text-xl text-sage-dark flex items-center gap-2">
                    <Palette className="w-5 h-5 text-sage" />
                    Choose a Theme
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a style that reflects {memorial.firstName}&apos;s personality
                  </p>
                </div>
                <button onClick={() => setShowThemeSelector(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(MEMORIAL_THEMES) as [ThemeKey, typeof MEMORIAL_THEMES[ThemeKey]][]).map(([key, themeOption]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentTheme(key);
                      toast.success(`Theme changed to ${themeOption.name}`);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      currentTheme === key
                        ? "border-sage bg-sage-pale/30 shadow-md"
                        : "border-gray-200 hover:border-sage-light hover:bg-gray-50"
                    }`}
                  >
                    {currentTheme === key && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sage flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <themeOption.icon className="w-6 h-6 mb-2" />
                    <span className="font-medium text-gray-dark block">{themeOption.name}</span>
                    <span className="text-xs text-gray-500">{themeOption.description}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                  Theme changes are applied instantly and saved automatically
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tradition Editor Modal */}
      <TraditionEditor
        isOpen={showTraditionEditor}
        onClose={() => {
          setShowTraditionEditor(false);
          setEditingTradition(null);
        }}
        onSave={handleSaveTradition}
        tradition={editingTradition}
        userName="Family Member"
      />

      {/* Music Editor Modal */}
      <MusicEditor
        isOpen={showMusicEditor}
        onClose={() => {
          setShowMusicEditor(false);
          setEditingMusic(null);
        }}
        onSave={handleSaveMusic}
        music={editingMusic}
        userName="Family Member"
      />
    </div>
  );
}
