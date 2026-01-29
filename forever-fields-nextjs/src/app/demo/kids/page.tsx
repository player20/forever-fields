"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { KidsMemorialExplorer, StoryTime, MilestoneMessages, MySpaceForGrandma } from "@/components/kids";
import { LegacyCompanion, VoiceMemoryCapture } from "@/components/ai";
import { QRMemorialCode, SimpleFamilyTree, GedcomImport, CemeteryImport, GraveLocator } from "@/components/memorial";
import { PhotoEnhancer } from "@/components/photos";
import { VoiceSampleUploader, VoiceMessageGenerator } from "@/components/voice";
import { AnimatedMemoryGenerator } from "@/components/video";
import { MemoryMap, FamilyRecipeBook, CollaborativeMemoryWall, MemorialSlideshowMaker } from "@/components/family";
import { FuneralPlanningHub, MemorialShop, PrePlanningPortal } from "@/components/planning";

type DemoMode = "menu" | "explorer" | "stories" | "milestones" | "create" | "companion" | "qr" | "family" | "gedcom" | "photos" | "voice" | "animate" | "capture" | "memorymap" | "recipes" | "wall" | "slideshow" | "cemetery" | "gravelocator" | "funeral" | "shop" | "preplanning";

// Types for voice components
interface VoiceSample {
  id: string;
  name: string;
  type: "audio" | "video";
  url: string;
  duration?: number;
  uploadedAt: Date;
}

interface GeneratedMessage {
  id: string;
  text: string;
  audioUrl: string | null;
  createdAt: Date;
  occasion?: string;
}

// Sample data for demo
const sampleAncestor = {
  id: "demo-grandma",
  firstName: "Margaret",
  lastName: "Johnson",
  name: "Margaret Johnson",
  relationship: "Grandmother",
  birthYear: "1942",
  deathYear: "2023",
  profilePhotoUrl: undefined,
  biography: "Margaret was a beloved mother, grandmother, and community pillar. She spent 40 years as a schoolteacher, touching the lives of thousands of students. Her kitchen was always warm with the smell of fresh cookies, and her garden was the pride of the neighborhood.",
  hasLegacyData: true,
  favoriteThings: [
    { icon: "🦋", label: "Butterflies", description: "She said they reminded her of angels" },
    { icon: "🍪", label: "Baking cookies", description: "Her chocolate chip cookies were famous" },
    { icon: "🌹", label: "Her garden", description: "Roses were her favorite" },
    { icon: "📚", label: "Reading stories", description: "She read to us every night" },
  ],
  stories: [
    {
      id: "1",
      title: "The Christmas Cookies",
      content: "Every Christmas Eve, Grandma would make her special sugar cookies. We'd all gather in the kitchen, flour everywhere, and she'd let us decorate them however we wanted. She never got mad about the mess. She'd just say, 'Memories are more important than clean floors.'",
      recordedBy: "Mom",
      duration: 120,
    },
    {
      id: "2",
      title: "Grandma's Garden",
      content: "Grandma's garden was magical. She knew the name of every flower and would tell us stories about each one. Her roses won ribbons at the county fair three years in a row. She always said the secret was talking to them.",
      recordedBy: "Uncle Jim",
      duration: 90,
    },
  ],
  wisdom: [
    "Love fiercely and forgive quickly.",
    "You can do hard things. You come from strong people.",
    "Family isn't just blood - it's the people who show up.",
    "Don't count your chickens before they hatch.",
    "Every person has a story worth hearing.",
  ],
  phrases: [
    "I love you to the moon and back.",
    "Drive safe, call when you get there.",
    "You're never too old for a hug.",
  ],
};

const sampleMilestones = [
  {
    id: "1",
    title: "For Your 16th Birthday",
    occasion: "16th Birthday",
    unlockAge: 16,
    content: "My darling, sixteen feels like such a grown-up age, but remember - you don't have to have it all figured out. These years are for exploring, making mistakes, and finding out who you are. Trust yourself. You have good instincts. And when things get hard (they will), remember that you come from strong people who love you more than you can imagine.",
    fromName: "Your Family",
    fromRelationship: "family",
    writtenInSpiritOf: "Grandma Margaret",
    isUnlocked: true,
  },
  {
    id: "2",
    title: "For Your 18th Birthday",
    occasion: "18th Birthday",
    unlockAge: 18,
    content: "Happy 18th birthday! You're officially an adult, though between us, nobody ever feels ready for that. Grandma would want you to know that being an adult doesn't mean having all the answers - it means having the courage to keep asking questions. Go make beautiful mistakes. Fall in love. Travel if you can. And always, always come home for the holidays.",
    fromName: "Your Family",
    fromRelationship: "family",
    writtenInSpiritOf: "Grandma Margaret",
    isUnlocked: false,
  },
  {
    id: "3",
    title: "For Your Wedding Day",
    occasion: "Wedding",
    content: "Oh, how I wish I could be there to see you on this day. Know that I am - in the flowers, in the laughter, in the love that fills the room. Marriage is wonderful and hard and worth every moment. Be patient with each other. Fight fair. Never go to bed angry. And remember that the person you're marrying is someone's child too - love them the way you'd want someone to love yours.",
    fromName: "Your Family",
    fromRelationship: "family",
    writtenInSpiritOf: "Grandma Margaret",
    isUnlocked: false,
  },
  {
    id: "4",
    title: "For When You Have Your First Child",
    occasion: "First Child",
    content: "You're a parent now. I know you're terrified - that's how it's supposed to feel. But here's the secret: you already know how to do this. You learned from being loved. You learned from watching your parents. You learned from me. Trust that love. Your baby doesn't need perfection. They just need you - present, patient, and trying your best. That's enough. That's everything.",
    fromName: "Your Family",
    fromRelationship: "family",
    writtenInSpiritOf: "Grandma Margaret",
    isUnlocked: false,
  },
];

export default function KidsDemoPage() {
  const [mode, setMode] = useState<DemoMode>("menu");

  if (mode === "explorer") {
    return (
      <div>
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <KidsMemorialExplorer
          ancestor={sampleAncestor}
          viewerName="Emma"
        />
      </div>
    );
  }

  if (mode === "stories") {
    return (
      <div>
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <StoryTime
          ancestorName="Grandma Margaret"
          stories={sampleAncestor.stories}
          onRecordStory={() => toast.info("Recording feature coming soon!")}
        />
      </div>
    );
  }

  if (mode === "milestones") {
    return (
      <div>
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <MilestoneMessages
          recipientName="Emma"
          recipientBirthDate="2010-03-15"
          ancestorName="Grandma Margaret"
          messages={sampleMilestones}
        />
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div>
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <MySpaceForGrandma
          ancestorName="Grandma Margaret"
          creatorName="Emma"
          creations={[]}
          onSave={(creation) => {
            console.log("Saved:", creation);
            toast.success("Saved! (Demo mode)");
          }}
        />
      </div>
    );
  }

  if (mode === "companion") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <LegacyCompanion
          profile={{
            name: "Grandma Margaret",
            relationship: "grandmother",
            birthYear: "1942",
            deathYear: "2023",
            biography: sampleAncestor.biography,
            memories: sampleAncestor.stories.map(s => s.content),
            phrases: sampleAncestor.phrases,
            interests: ["gardening", "baking", "teaching", "family gatherings"],
          }}
          userRelationship="grandchild"
        />
      </div>
    );
  }

  if (mode === "qr") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <QRMemorialCode
            memorialId="demo-grandma"
            memorialUrl="https://foreverfields.com/memorial/grandma-margaret"
            deceasedName="Margaret Johnson"
            birthYear="1942"
            deathYear="2023"
            showDownloadOptions={true}
          />
        </div>
      </div>
    );
  }

  if (mode === "family") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl text-sage-dark mb-6 text-center">
            Johnson Family Tree
          </h1>
          <SimpleFamilyTree
            people={[
              {
                id: "grandma",
                name: "Margaret Johnson",
                birthYear: "1942",
                deathYear: "2023",
                isDeceased: true,
                relationship: "Grandmother",
                memorialId: "demo-grandma",
              },
              {
                id: "grandpa",
                name: "Robert Johnson",
                birthYear: "1940",
                deathYear: "2019",
                isDeceased: true,
                relationship: "Grandfather",
                memorialId: "demo-grandpa",
              },
              {
                id: "mom",
                name: "Sarah Johnson-Smith",
                birthYear: "1968",
                isDeceased: false,
                relationship: "Mother",
              },
              {
                id: "uncle",
                name: "James Johnson",
                birthYear: "1970",
                isDeceased: false,
                relationship: "Uncle",
              },
              {
                id: "emma",
                name: "Emma Smith",
                birthYear: "2010",
                isDeceased: false,
                relationship: "You",
              },
            ]}
            rootPersonId="grandma"
            onPersonClick={(personId) => {
              if (personId === "grandma") {
                setMode("explorer");
              } else {
                toast.info(`Would navigate to memorial for ${personId}`);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "gedcom") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <GedcomImport
            onImport={(data) => {
              console.log("Imported family tree:", data);
              toast.success(`Successfully imported ${Object.keys(data.people).length} family members!`);
              setMode("family");
            }}
            onCancel={() => setMode("menu")}
          />
        </div>
      </div>
    );
  }

  if (mode === "photos") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <PhotoEnhancer
            onSave={(url, analysis) => {
              console.log("Enhanced photo:", url, analysis);
              toast.success("Photo saved! (Demo mode)");
              setMode("menu");
            }}
            onCancel={() => setMode("menu")}
          />
        </div>
      </div>
    );
  }

  if (mode === "voice") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto space-y-6">
          <VoiceSampleUploader
            ancestorName="Grandma Margaret"
            onComplete={(samples: VoiceSample[]) => {
              console.log("Voice samples:", samples);
              toast.success(`${samples.length} voice samples ready for cloning!`);
            }}
          />
          <VoiceMessageGenerator
            voiceProfile={{
              id: "demo-voice",
              ancestorName: "Grandma Margaret",
              sampleUrls: [], // Would be populated from uploaded samples
              createdAt: new Date(),
            }}
            onMessageGenerated={(message: GeneratedMessage) => {
              console.log("Generated message:", message);
              toast.success("Voice message generated! (Demo mode - requires Replicate API key)");
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "animate") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <AnimatedMemoryGenerator
            ancestorName="Grandma Margaret"
            onVideoGenerated={(url) => {
              console.log("Video generated:", url);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "capture") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <VoiceMemoryCapture
            deceasedName="Grandma Margaret"
            relationship="grandmother"
            onSave={(memory) => {
              console.log("Memory saved:", memory);
              toast.success(`Memory saved! Title: ${memory.title}, Key Points: ${memory.keyPoints.length}`);
              setMode("menu");
            }}
            onCancel={() => setMode("menu")}
          />
        </div>
      </div>
    );
  }

  if (mode === "memorymap") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-4xl mx-auto">
          <MemoryMap
            ancestorName="Grandma Margaret"
            currentUser="Emma"
            onAddLocation={(location) => {
              console.log("Added location:", location);
              toast.success(`Location added: ${location.title}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "recipes") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-4xl mx-auto">
          <FamilyRecipeBook
            familyName="Johnson"
            currentUser="Emma"
            onAddRecipe={(recipe) => {
              console.log("Added recipe:", recipe);
              toast.success(`Recipe added: ${recipe.title}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "wall") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-4xl mx-auto">
          <CollaborativeMemoryWall
            deceasedName="Grandma Margaret"
            currentUser="Emma"
            userRelationship="Granddaughter"
            onAddPost={(post) => {
              console.log("Added post:", post);
              toast.success(`Memory shared: ${post.content.substring(0, 50)}...`);
            }}
            onReact={(postId, type) => {
              console.log("Reaction:", postId, type);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "slideshow") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-4xl mx-auto">
          <MemorialSlideshowMaker
            deceasedName="Grandma Margaret"
            birthYear="1942"
            deathYear="2023"
            onSave={(config) => {
              console.log("Slideshow saved:", config);
              toast.success(`Slideshow saved with ${config.photos.length} photos!`);
            }}
            onExport={(format) => {
              toast.info(`Export as ${format} - Coming soon!`);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "cemetery") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <CemeteryImport
            defaultName="Margaret Johnson"
            onImport={(record) => {
              console.log("Cemetery record imported:", record);
              toast.success(`Imported: ${record.firstName} ${record.lastName} - Cemetery: ${record.cemeteryName}`);
              setMode("gravelocator");
            }}
            onCancel={() => setMode("menu")}
          />
        </div>
      </div>
    );
  }

  if (mode === "gravelocator") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <button
          onClick={() => setMode("menu")}
          className="mb-4 text-gray-500 hover:text-sage flex items-center gap-2"
        >
          ← Back to Demo Menu
        </button>
        <div className="max-w-2xl mx-auto">
          <GraveLocator
            location={{
              deceasedName: "Grandma Margaret",
              cemeteryName: "Greenwood Memorial Park",
              cemeteryAddress: "123 Memorial Lane",
              cemeteryCity: "Brooklyn",
              cemeteryState: "NY",
              cemeteryCountry: "USA",
              section: "Garden of Peace",
              lot: "A",
              plot: "142",
              gpsLat: 40.6501,
              gpsLng: -73.9496,
              epitaph: "Forever in our hearts",
              notes: "Enter through the main gate, turn left at the fountain. The plot is near the large oak tree.",
            }}
            showDirections={true}
            onVisitLogged={(visit) => {
              console.log("Visit logged:", visit);
              toast.success(`Visit logged on ${visit.date.toLocaleDateString()}${visit.note ? ` - Note: ${visit.note}` : ""}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (mode === "funeral") {
    return (
      <div className="min-h-screen bg-gray-50">
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <FuneralPlanningHub
          deceasedName="Margaret Johnson"
          onSave={(plan) => {
            console.log("Funeral plan saved:", plan);
            toast.success("Funeral plan saved! (Demo mode)");
          }}
        />
      </div>
    );
  }

  if (mode === "shop") {
    return (
      <div className="min-h-screen bg-gray-50">
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <MemorialShop
          memorialId="demo-grandma"
          deceasedName="Margaret Johnson"
          onOrderComplete={(order) => {
            console.log("Order completed:", order);
            toast.success(`Order ${order.id} placed successfully!`);
          }}
        />
      </div>
    );
  }

  if (mode === "preplanning") {
    return (
      <div className="min-h-screen bg-gray-50">
        <button
          onClick={() => setMode("menu")}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-sage-dark hover:bg-white transition-colors"
        >
          ← Back to Demo Menu
        </button>
        <PrePlanningPortal
          userId="demo-user"
          onSave={(plan) => {
            console.log("Pre-plan saved:", plan);
          }}
          onComplete={(plan) => {
            console.log("Pre-plan completed:", plan);
            toast.success("Your pre-plan has been saved and marked as complete!");
          }}
        />
      </div>
    );
  }

  // Demo Menu
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-pale to-cream p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-sage hover:underline text-sm mb-4 block">
            ← Back to Home
          </a>
          <h1 className="font-display text-4xl text-sage-dark mb-2">
            For the Children
          </h1>
          <p className="text-gray-600 text-lg">
            Age-appropriate ways for kids to connect with ancestors
          </p>
        </div>

        {/* Demo Ancestor Card */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-sage-pale flex items-center justify-center text-3xl">
                👵
              </div>
              <div>
                <h2 className="font-display text-2xl text-sage-dark">
                  {sampleAncestor.name}
                </h2>
                <p className="text-gray-600">
                  {sampleAncestor.birthYear} — {sampleAncestor.deathYear}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Demo memorial for testing features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="space-y-4">
          <button
            onClick={() => setMode("explorer")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🧒</span>
                  <div>
                    <CardTitle>Kids Memorial Explorer</CardTitle>
                    <CardDescription>
                      Age-appropriate views: Little ones (4-7), Explorers (8-12), Teens (13-17)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("stories")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎧</span>
                  <div>
                    <CardTitle>Story Time</CardTitle>
                    <CardDescription>
                      Audio stories with sleep timer, recorded by family members
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("milestones")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gold/5">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">💌</span>
                  <div>
                    <CardTitle>Milestone Messages</CardTitle>
                    <CardDescription>
                      Time capsule messages that unlock on birthdays, graduation, wedding
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("create")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎨</span>
                  <div>
                    <CardTitle>My Space for Grandma</CardTitle>
                    <CardDescription>
                      Draw pictures, write letters, record voice messages
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("companion")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow border-sage">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">💬</span>
                  <div>
                    <CardTitle>Legacy Companion</CardTitle>
                    <CardDescription>
                      AI-powered conversations based on Grandma's stories and wisdom
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("qr")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📱</span>
                  <div>
                    <CardTitle>QR Memorial Code</CardTitle>
                    <CardDescription>
                      Generate and download QR codes for headstones and memorial cards
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("family")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🌳</span>
                  <div>
                    <CardTitle>Family Tree</CardTitle>
                    <CardDescription>
                      Interactive family tree connecting generations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("gedcom")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-sage-pale/30">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📥</span>
                  <div>
                    <CardTitle>Import GEDCOM</CardTitle>
                    <CardDescription>
                      Import family tree from Ancestry, FamilySearch, or other genealogy apps
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("photos")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow border-gold">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">✨</span>
                  <div>
                    <CardTitle>Photo Magic</CardTitle>
                    <CardDescription>
                      Colorize B&W photos, restore faces, auto-caption with AI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("voice")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow border-sage bg-gradient-to-r from-sage-pale/50 to-gold/10">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎙️</span>
                  <div>
                    <CardTitle>Hear Their Voice</CardTitle>
                    <CardDescription>
                      Clone their voice from recordings, generate new messages
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("animate")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-gold/20 to-sage/20 border-2 border-gold">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎬</span>
                  <div>
                    <CardTitle>Animated Memory</CardTitle>
                    <CardDescription>
                      Bring their photo to life - watch them speak to you
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("capture")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">💭</span>
                  <div>
                    <CardTitle>Speak Your Memory</CardTitle>
                    <CardDescription>
                      Talk about them, AI extracts key points for review
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          {/* Family-Wide Features Section */}
          <div className="pt-6 pb-2">
            <h2 className="text-xl font-display text-sage-dark text-center">
              For the Whole Family
            </h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Collaborative features for everyone to participate
            </p>
          </div>

          <button
            onClick={() => setMode("memorymap")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-sage-pale/30 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🗺️</span>
                  <div>
                    <CardTitle>Memory Map</CardTitle>
                    <CardDescription>
                      Pin meaningful places on a map - where they lived, worked, and loved
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("recipes")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-warm-cream to-transparent">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📖</span>
                  <div>
                    <CardTitle>Family Recipe Book</CardTitle>
                    <CardDescription>
                      Preserve cherished recipes with stories, scan handwritten cards with AI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("wall")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow border-sage-light">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🧱</span>
                  <div>
                    <CardTitle>Memory Wall</CardTitle>
                    <CardDescription>
                      Share memories, photos, quotes - react with love, candles, and flowers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("slideshow")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-gold/10 to-transparent border-gold/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎞️</span>
                  <div>
                    <CardTitle>Memorial Slideshow</CardTitle>
                    <CardDescription>
                      Create beautiful photo tributes with music - for funerals or anniversaries
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("cemetery")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🪦</span>
                  <div>
                    <CardTitle>Cemetery Database</CardTitle>
                    <CardDescription>
                      Import from Find A Grave, BillionGraves - get GPS coordinates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("gravelocator")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-sage/10 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📍</span>
                  <div>
                    <CardTitle>Grave Locator</CardTitle>
                    <CardDescription>
                      GPS navigation to the grave site with directions and visit logging
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          {/* Planning & Business Features Section */}
          <div className="pt-6 pb-2">
            <h2 className="text-xl font-display text-sage-dark text-center">
              Planning & Services
            </h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Tools for funeral planning, memorials, and pre-planning
            </p>
          </div>

          <button
            onClick={() => setMode("funeral")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-red-50 to-transparent border-red-200">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📋</span>
                  <div>
                    <CardTitle>Funeral Planning Hub</CardTitle>
                    <CardDescription>
                      Complete checklist, vendor management, budget tracking, family coordination
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("shop")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-transparent border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🛒</span>
                  <div>
                    <CardTitle>Memorial Shop</CardTitle>
                    <CardDescription>
                      Photo books, QR plaques, memorial cards, canvas prints, jewelry & keepsakes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button
            onClick={() => setMode("preplanning")}
            className="w-full text-left"
          >
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-transparent border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">📝</span>
                  <div>
                    <CardTitle>Pre-Planning Portal</CardTitle>
                    <CardDescription>
                      Plan your own memorial - final wishes, legacy messages, documents, digital assets
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>
        </div>

        {/* Info Note */}
        <Card className="mt-8 bg-sage-pale/30 border-0">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-600">
              These features are designed with emotional sensitivity in mind.
              <br />
              <span className="text-sage">Never pretending the person is alive</span> —
              celebrating their legacy and wisdom.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
