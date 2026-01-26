"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { MemoryAssistant, LegacyCompanion } from "@/components/ai";
import { KidsMemorialExplorer, StoryTime, MilestoneMessages, MySpaceForGrandma } from "@/components/kids";
import { QRMemorialCode, SimpleFamilyTree } from "@/components/memorial";
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
} from "lucide-react";

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
}

interface MemorialViewProps {
  memorial: Memorial;
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

export function MemorialView({ memorial }: MemorialViewProps) {
  const [activeTab, setActiveTab] = useState<"memories" | "photos" | "timeline" | "family" | "candles">("memories");
  const [showMemoryAssistant, setShowMemoryAssistant] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("default");

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

  // Share functions
  const shareUrl = typeof window !== "undefined" ? window.location.href : `/memorial/${memorial.slug}`;

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
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 bg-sage-dark">
        {memorial.coverPhotoUrl ? (
          <Image
            src={memorial.coverPhotoUrl}
            alt={`Cover photo for ${fullName}`}
            fill
            className="object-cover opacity-80"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-sage to-sage-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Share Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleNativeShare}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share</span>
        </motion.button>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col md:flex-row items-center md:items-end gap-6"
        >
          {/* Profile Photo */}
          <motion.div
            variants={scaleIn}
            className="w-40 h-40 rounded-full border-4 border-cream shadow-xl overflow-hidden bg-sage-pale"
          >
            {memorial.profilePhotoUrl ? (
              <Image
                src={memorial.profilePhotoUrl}
                alt={fullName}
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sage-dark text-4xl font-display">
                {memorial.firstName[0]}{memorial.lastName[0]}
              </div>
            )}
          </motion.div>

          {/* Name & Dates */}
          <motion.div variants={fadeIn} className="text-center md:text-left pb-4">
            <h1 className="font-display text-4xl md:text-5xl text-sage-dark">
              {fullName}
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              {memorial.birthDate && formatDate(memorial.birthDate)}
              {memorial.birthDate && memorial.deathDate && " — "}
              {memorial.deathDate && formatDate(memorial.deathDate)}
              {age && <span className="ml-2 text-sage">({age} years)</span>}
            </p>
          </motion.div>
        </motion.div>

        {/* Biography */}
        {memorial.biography && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {memorial.biography}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Interactive Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setViewMode("kids")}
            className="p-4 bg-sage-pale hover:bg-sage-light rounded-xl transition-colors text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🧒</span>
            <span className="text-sm font-medium text-sage-dark">For Children</span>
            <span className="text-xs text-gray-500 block">Age-appropriate view</span>
          </button>

          <button
            onClick={() => setViewMode("companion")}
            className="p-4 bg-sage-pale hover:bg-sage-light rounded-xl transition-colors text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💬</span>
            <span className="text-sm font-medium text-sage-dark">Talk to {memorial.firstName}</span>
            <span className="text-xs text-gray-500 block">AI companion</span>
          </button>

          <button
            onClick={() => setViewMode("stories")}
            className="p-4 bg-sage-pale hover:bg-sage-light rounded-xl transition-colors text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🎧</span>
            <span className="text-sm font-medium text-sage-dark">Story Time</span>
            <span className="text-xs text-gray-500 block">Listen to memories</span>
          </button>

          <button
            onClick={() => setViewMode("milestones")}
            className="p-4 bg-gold/20 hover:bg-gold/30 rounded-xl transition-colors text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">💌</span>
            <span className="text-sm font-medium text-sage-dark">Time Capsule</span>
            <span className="text-xs text-gray-500 block">Milestone messages</span>
          </button>
        </div>

        {/* Create Something Section */}
        <Card className="mt-4 bg-gradient-to-r from-sage-pale/50 to-gold/10 border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sage-dark">Create something for {memorial.firstName}</p>
                <p className="text-sm text-gray-500">Draw a picture, write a letter, or record a message</p>
              </div>
              <Button onClick={() => setViewMode("create")} variant="secondary">
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-8 border-b border-sage-light">
          {(["memories", "photos", "timeline", "family", "candles"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-colors ${
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
        </div>

        {/* QR Code Section */}
        <div className="mt-8 mb-12">
          <QRMemorialCode
            memorialId={memorial.id}
            memorialUrl={typeof window !== "undefined" ? window.location.href : `/memorial/${memorial.slug}`}
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

              <div className="space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-sage-pale/30 transition-colors"
                >
                  <Copy className="w-5 h-5 text-sage" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-sage-pale/30 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span>Share on Facebook</span>
                </button>

                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-sage-pale hover:bg-sage-pale/30 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-sky-500" />
                  <span>Share on Twitter</span>
                </button>
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
    </div>
  );
}
