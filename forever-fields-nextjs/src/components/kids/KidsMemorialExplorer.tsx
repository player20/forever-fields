"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

type AgeGroup = "little" | "explorer" | "teen" | "adult";

interface Ancestor {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  profilePhotoUrl?: string;
  birthYear?: string;
  deathYear?: string;
  favoriteThings?: {
    icon: string;
    label: string;
    description?: string;
  }[];
  stories?: {
    id: string;
    title: string;
    content: string;
    audioUrl?: string;
    recordedBy?: string;
  }[];
  wisdom?: string[];
  phrases?: string[];
}

interface KidsMemorialExplorerProps {
  ancestor: Ancestor;
  viewerName?: string;
  onAgeSelected?: (age: AgeGroup) => void;
}

export function KidsMemorialExplorer({
  ancestor,
  viewerName,
  onAgeSelected,
}: KidsMemorialExplorerProps) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [isSelectingAge, setIsSelectingAge] = useState(true);

  // Check localStorage for remembered age
  useEffect(() => {
    const savedAge = localStorage.getItem("foreverfields_age_group") as AgeGroup | null;
    if (savedAge) {
      setAgeGroup(savedAge);
      setIsSelectingAge(false);
    }
  }, []);

  const handleAgeSelect = (age: AgeGroup, remember: boolean = false) => {
    setAgeGroup(age);
    setIsSelectingAge(false);
    if (remember) {
      localStorage.setItem("foreverfields_age_group", age);
    }
    onAgeSelected?.(age);
  };

  const fullName = `${ancestor.firstName} ${ancestor.lastName}`;

  // Age selection screen
  if (isSelectingAge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sage-pale to-cream flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            {ancestor.profilePhotoUrl && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-sage-light">
                <img
                  src={ancestor.profilePhotoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardTitle className="font-display text-2xl">
              Welcome to {ancestor.firstName}'s Memorial
            </CardTitle>
            <CardDescription className="text-base">
              {viewerName ? `Hi ${viewerName}! ` : ""}
              How old are you? We'll show you the best way to explore.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => handleAgeSelect("little")}
              className="w-full p-4 rounded-xl bg-sage-pale hover:bg-sage-light transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🌻</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">I'm little (4-7)</p>
                  <p className="text-sm text-gray-600">
                    Big pictures and fun stories about {ancestor.firstName}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAgeSelect("explorer")}
              className="w-full p-4 rounded-xl bg-sage-pale hover:bg-sage-light transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔍</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">I'm an explorer (8-12)</p>
                  <p className="text-sm text-gray-600">
                    Discover {ancestor.firstName}'s story with missions and facts
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAgeSelect("teen")}
              className="w-full p-4 rounded-xl bg-sage-pale hover:bg-sage-light transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">💭</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">I'm a teen (13-17)</p>
                  <p className="text-sm text-gray-600">
                    Learn {ancestor.firstName}'s wisdom and connect deeper
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAgeSelect("adult")}
              className="w-full p-4 rounded-xl bg-sage-pale hover:bg-sage-light transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">📖</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">I'm an adult (18+)</p>
                  <p className="text-sm text-gray-600">
                    Full memorial with all stories and features
                  </p>
                </div>
              </div>
            </button>

            <p className="text-center text-xs text-gray-400 pt-4">
              You can change this anytime
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Route to appropriate experience based on age
  return (
    <div className="min-h-screen bg-cream">
      {/* Age indicator & switch */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsSelectingAge(true)}
          className="text-xs bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow text-gray-500 hover:text-sage-dark transition-colors"
        >
          {ageGroup === "little" && "🌻 Little Explorer"}
          {ageGroup === "explorer" && "🔍 Explorer"}
          {ageGroup === "teen" && "💭 Teen"}
          {ageGroup === "adult" && "📖 Adult"}
          <span className="ml-1">· Change</span>
        </button>
      </div>

      {/* Render appropriate experience */}
      {ageGroup === "little" && (
        <GrandmasWorldPreview ancestor={ancestor} />
      )}
      {ageGroup === "explorer" && (
        <ExplorerModePreview ancestor={ancestor} />
      )}
      {ageGroup === "teen" && (
        <TeenWisdomPreview ancestor={ancestor} />
      )}
      {ageGroup === "adult" && (
        <AdultViewMessage />
      )}
    </div>
  );
}

// Preview components (will be expanded into full components)
function GrandmasWorldPreview({ ancestor }: { ancestor: Ancestor }) {
  const fullName = `${ancestor.firstName} ${ancestor.lastName}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-pale via-cream to-sage-pale p-6">
      <div className="max-w-md mx-auto text-center pt-8">
        {/* Friendly header */}
        <h1 className="font-display text-4xl text-sage-dark mb-2">
          {ancestor.firstName}'s World
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Let's learn about your {ancestor.relationship}!
        </p>

        {/* Big friendly photo */}
        <div className="w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden border-8 border-white shadow-xl">
          {ancestor.profilePhotoUrl ? (
            <img
              src={ancestor.profilePhotoUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-sage-light flex items-center justify-center">
              <span className="text-6xl">👵</span>
            </div>
          )}
        </div>

        {/* Favorite things */}
        <h2 className="font-display text-2xl text-sage-dark mb-4">
          {ancestor.firstName} loved...
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(ancestor.favoriteThings || [
            { icon: "🦋", label: "Butterflies" },
            { icon: "🍪", label: "Baking cookies" },
            { icon: "🌹", label: "Her garden" },
            { icon: "📚", label: "Reading stories" },
          ]).map((thing, i) => (
            <button
              key={i}
              className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <span className="text-4xl block mb-2">{thing.icon}</span>
              <span className="text-sage-dark font-medium">{thing.label}</span>
            </button>
          ))}
        </div>

        {/* Story time button */}
        <Button size="lg" className="w-full max-w-xs text-lg py-6">
          🎧 Listen to a Story
        </Button>

        <p className="text-sm text-gray-500 mt-8">
          Tap any picture to learn more!
        </p>
      </div>
    </div>
  );
}

function ExplorerModePreview({ ancestor }: { ancestor: Ancestor }) {
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  const missions = [
    { id: "song", label: `Find ${ancestor.firstName}'s favorite song`, icon: "🎵" },
    { id: "dream", label: "Learn what they wanted to be when young", icon: "✨" },
    { id: "story", label: "Read a story from when your parent was little", icon: "📖" },
    { id: "compare", label: `See what life was like when ${ancestor.firstName} was YOUR age`, icon: "⏰" },
  ];

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header with photo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-sage">
            {ancestor.profilePhotoUrl ? (
              <img src={ancestor.profilePhotoUrl} alt={ancestor.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sage-light flex items-center justify-center text-3xl">👵</div>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl text-sage-dark">
              Discover {ancestor.firstName}'s Story
            </h1>
            <p className="text-gray-600">Your {ancestor.relationship}</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sage-dark">Explorer Progress</span>
              <span className="text-sage">{completedMissions.length}/{missions.length} missions</span>
            </div>
            <div className="w-full h-3 bg-sage-pale rounded-full overflow-hidden">
              <div
                className="h-full bg-sage transition-all"
                style={{ width: `${(completedMissions.length / missions.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Missions */}
        <h2 className="font-display text-xl text-sage-dark mb-4">🎯 Your Missions</h2>
        <div className="space-y-3 mb-8">
          {missions.map((mission) => (
            <button
              key={mission.id}
              onClick={() => {
                if (!completedMissions.includes(mission.id)) {
                  setCompletedMissions([...completedMissions, mission.id]);
                }
              }}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                completedMissions.includes(mission.id)
                  ? "bg-sage/20 border-2 border-sage"
                  : "bg-white shadow hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mission.icon}</span>
                <span className={completedMissions.includes(mission.id) ? "line-through text-gray-400" : "text-sage-dark"}>
                  {mission.label}
                </span>
                {completedMissions.includes(mission.id) && (
                  <span className="ml-auto text-sage">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Did you know */}
        <Card className="bg-gold/10 border-gold/30">
          <CardContent className="py-4">
            <h3 className="font-medium text-gold-dark mb-2">💡 Did you know?</h3>
            <p className="text-gray-700">
              When {ancestor.firstName} was your age, there were no cell phones or internet!
              People wrote letters to talk to friends far away.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeenWisdomPreview({ ancestor }: { ancestor: Ancestor }) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = [
    { id: "alone", label: "When you're feeling alone", icon: "💙" },
    { id: "choice", label: "When you're making a hard choice", icon: "🤔" },
    { id: "future", label: "About finding your path", icon: "🌟" },
    { id: "love", label: "About love and relationships", icon: "❤️" },
  ];

  const wisdom: Record<string, string> = {
    alone: `${ancestor.firstName} would say: "You're never truly alone. The people who love you are always with you, even when you can't see them. And remember - everyone feels lonely sometimes. It's okay to reach out."`,
    choice: `${ancestor.firstName} believed: "Trust your gut. You know more than you think you do. And if you make a mistake? That's okay too. The only real mistake is not trying at all."`,
    future: `${ancestor.firstName}'s advice: "Don't rush to figure everything out. Life has a way of showing you the path when you're ready. Focus on what makes your heart feel full."`,
    love: `${ancestor.firstName} always said: "Love isn't just about the big moments. It's about showing up every day, even when it's hard. Choose someone who makes you feel like the best version of yourself."`,
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-sage">
            {ancestor.profilePhotoUrl ? (
              <img src={ancestor.profilePhotoUrl} alt={ancestor.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sage-light flex items-center justify-center text-4xl">👵</div>
            )}
          </div>
          <h1 className="font-display text-3xl text-sage-dark">
            What Would {ancestor.firstName} Say?
          </h1>
          <p className="text-gray-600 mt-2">
            Wisdom from your {ancestor.relationship}, based on their values and beliefs
          </p>
        </div>

        {/* Topics */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedTopic === topic.id
                  ? "bg-sage text-white"
                  : "bg-white shadow hover:shadow-md"
              }`}
            >
              <span className="text-2xl block mb-1">{topic.icon}</span>
              <span className="font-medium">{topic.label}</span>
            </button>
          ))}
        </div>

        {/* Wisdom response */}
        {selectedTopic && (
          <Card className="bg-sage-pale/50">
            <CardContent className="py-6">
              <p className="text-lg text-gray-700 italic leading-relaxed">
                {wisdom[selectedTopic]}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Based on stories and values shared by family
              </p>
            </CardContent>
          </Card>
        )}

        {/* Journal prompt */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Want to write your own thoughts or a letter to {ancestor.firstName}?
          </p>
          <Button variant="outline">📝 Open My Journal</Button>
        </div>
      </div>
    </div>
  );
}

function AdultViewMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardContent className="py-8">
          <span className="text-5xl block mb-4">📖</span>
          <h2 className="font-display text-2xl text-sage-dark mb-2">
            Adult View
          </h2>
          <p className="text-gray-600 mb-4">
            You have access to the full memorial with all features.
          </p>
          <Button>View Full Memorial</Button>
        </CardContent>
      </Card>
    </div>
  );
}
