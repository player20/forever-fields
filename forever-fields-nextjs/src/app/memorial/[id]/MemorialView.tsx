"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { MemoryAssistant, LegacyCompanion } from "@/components/ai";
import { KidsMemorialExplorer, StoryTime, MilestoneMessages, MySpaceForGrandma } from "@/components/kids";
import { QRMemorialCode, SimpleFamilyTree } from "@/components/memorial";
import { formatDate, calculateAge } from "@/lib/utils";

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

export function MemorialView({ memorial }: MemorialViewProps) {
  const [activeTab, setActiveTab] = useState<"memories" | "photos" | "timeline" | "family" | "candles">("memories");
  const [showMemoryAssistant, setShowMemoryAssistant] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("default");

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
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Profile Photo */}
          <div className="w-40 h-40 rounded-full border-4 border-cream shadow-xl overflow-hidden bg-sage-pale">
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
          </div>

          {/* Name & Dates */}
          <div className="text-center md:text-left pb-4">
            <h1 className="font-display text-4xl md:text-5xl text-sage-dark">
              {fullName}
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              {memorial.birthDate && formatDate(memorial.birthDate)}
              {memorial.birthDate && memorial.deathDate && " — "}
              {memorial.deathDate && formatDate(memorial.deathDate)}
              {age && <span className="ml-2 text-sage">({age} years)</span>}
            </p>
          </div>
        </div>

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
            <div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {memorial.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden bg-sage-pale relative group"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-sage-dark">
                  Virtual Candles
                </h2>
                <Button variant="secondary">
                  Light a Candle
                </Button>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {memorial.candles.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-gray-500">
                          Be the first to light a candle in remembrance.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  memorial.candles.map((candle) => (
                    <div
                      key={candle.id}
                      className="flex flex-col items-center group cursor-pointer"
                      title={candle.message || `Lit by ${candle.lighterName || "Anonymous"}`}
                    >
                      <div className="text-4xl animate-pulse">🕯️</div>
                      <span className="text-xs text-gray-500 mt-1 truncate max-w-full">
                        {candle.lighterName || "Anonymous"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
    </div>
  );
}
