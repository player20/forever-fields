"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  Palette,
  Trash2,
  Plus,
  X,
  Camera,
  Leaf,
  Scroll,
  Waves,
  Sun,
  Sparkles,
  Flower2,
  Check,
  Wand2,
  RefreshCw,
  Paintbrush,
  Maximize,
} from "lucide-react";

// Theme definitions
const THEMES = [
  { key: "garden", name: "Garden", description: "Nature-inspired greens", icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
  { key: "classic", name: "Classic", description: "Timeless sepia tones", icon: Scroll, color: "bg-amber-100 text-amber-700" },
  { key: "ocean", name: "Ocean", description: "Peaceful blue waters", icon: Waves, color: "bg-blue-100 text-blue-700" },
  { key: "sunset", name: "Sunset", description: "Warm golden hour", icon: Sun, color: "bg-orange-100 text-orange-700" },
  { key: "night", name: "Starlight", description: "Peaceful night sky", icon: Sparkles, color: "bg-indigo-100 text-indigo-700" },
  { key: "rose", name: "Rose Garden", description: "Romantic pink florals", icon: Flower2, color: "bg-rose-100 text-rose-700" },
];

interface Memorial {
  id: string;
  slug: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  resting_place: string | null;
  obituary: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  theme: string;
  is_public: boolean;
  privacy_level: string;
}

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

export default function EditMemorialPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const memorialId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "bio" | "photos" | "theme">("basic");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [restingPlace, setRestingPlace] = useState("");
  const [obituary, setObituary] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [theme, setTheme] = useState("garden");
  const [isPublic, setIsPublic] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState("public");
  const [photos, setPhotos] = useState<Photo[]>([]);

  // New photo form
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoDate, setNewPhotoDate] = useState("");

  // AI generation state
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPersonality, setAiPersonality] = useState("");
  const [aiBestMemory, setAiBestMemory] = useState("");
  const [aiLegacy, setAiLegacy] = useState("");
  const [aiTone, setAiTone] = useState<"casual" | "formal" | "religious" | "celebration">("casual");
  const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");
  const [isEnhancingPhoto, setIsEnhancingPhoto] = useState<string | null>(null);

  // Load memorial data
  useEffect(() => {
    async function fetchMemorial() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/memorials/${memorialId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch memorial");
        }

        const memorial = data.data?.memorial || data.memorial;
        if (!memorial) {
          throw new Error("Memorial not found");
        }

        // Populate form fields
        setFirstName(memorial.first_name || "");
        setMiddleName(memorial.middle_name || "");
        setLastName(memorial.last_name || "");
        setNickname(memorial.nickname || "");
        setBirthDate(memorial.birth_date || "");
        setDeathDate(memorial.death_date || "");
        setBirthPlace(memorial.birth_place || "");
        setRestingPlace(memorial.resting_place || "");
        setObituary(memorial.obituary || "");
        setProfilePhotoUrl(memorial.profile_photo_url || "");
        setCoverPhotoUrl(memorial.cover_photo_url || "");
        setTheme(memorial.theme || "garden");
        setIsPublic(memorial.is_public ?? true);
        setPrivacyLevel(memorial.privacy_level || "public");
        setPhotos(memorial.photos || []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load memorial");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemorial();
  }, [memorialId, router]);

  // Save changes
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/memorials/${memorialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          middleName: middleName.trim() || null,
          lastName: lastName.trim(),
          nickname: nickname.trim() || null,
          birthDate: birthDate || null,
          deathDate: deathDate || null,
          birthPlace: birthPlace.trim() || null,
          restingPlace: restingPlace.trim() || null,
          obituary: obituary.trim() || null,
          profilePhotoUrl: profilePhotoUrl.trim() || null,
          coverPhotoUrl: coverPhotoUrl.trim() || null,
          theme,
          isPublic,
          privacyLevel,
          photos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      toast.success("Memorial updated successfully!");

      // Get the updated slug in case name changed
      const updatedMemorial = data.data?.memorial || data.memorial;
      const newSlug = updatedMemorial?.slug || memorialId;

      router.push(`/memorial/${newSlug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Add photo
  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) {
      toast.error("Photo URL is required");
      return;
    }

    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || null,
      taken_at: newPhotoDate || null,
    };

    setPhotos([...photos, newPhoto]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setNewPhotoDate("");
    setShowAddPhoto(false);
    toast.success("Photo added");
  };

  // Remove photo
  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
    toast.success("Photo removed");
  };

  // Generate obituary with AI
  const handleGenerateObituary = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter the person's name first");
      return;
    }

    setIsGeneratingBio(true);
    setShowAiModal(false);

    try {
      const response = await fetch("/api/ai/generate-obituary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deceasedName: `${firstName} ${middleName || ""} ${lastName}`.replace(/\s+/g, " ").trim(),
          relationship: "family member",
          birthYear: birthDate ? new Date(birthDate).getFullYear().toString() : undefined,
          deathYear: deathDate ? new Date(deathDate).getFullYear().toString() : undefined,
          birthPlace: birthPlace || undefined,
          restingPlace: restingPlace || undefined,
          prompts: {
            personality: aiPersonality || undefined,
            bestMemory: aiBestMemory || undefined,
            legacy: aiLegacy || undefined,
          },
          tone: aiTone,
          length: aiLength,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate obituary");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  generatedText += parsed.text;
                  setObituary(generatedText);
                }
              } catch {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }

      toast.success("Obituary generated! Feel free to edit and personalize it.");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate obituary. Please try again.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  // Enhance photo with AI
  const handleEnhancePhoto = async (photoId: string, action: "restore" | "colorize") => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    setIsEnhancingPhoto(photoId);
    const endpoint = action === "restore" ? "/api/ai/photo-restore" : "/api/ai/photo-colorize";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photo.url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} photo`);
      }

      if (data.enhancedUrl || data.colorizedUrl || data.restoredUrl) {
        const newUrl = data.enhancedUrl || data.colorizedUrl || data.restoredUrl;
        setPhotos(photos.map((p) =>
          p.id === photoId ? { ...p, url: newUrl } : p
        ));
        toast.success(`Photo ${action === "restore" ? "restored" : "colorized"} successfully!`);
      }
    } catch (error) {
      console.error(`Photo ${action} error:`, error);
      toast.error(`Failed to ${action} photo. Please try again.`);
    } finally {
      setIsEnhancingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
          <p className="text-gray-body">Loading memorial...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "bio", label: "Biography", icon: FileText },
    { id: "photos", label: "Photos", icon: ImageIcon },
    { id: "theme", label: "Theme", icon: Palette },
  ] as const;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-pale/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/memorial/${memorialId}`}
                className="p-2 hover:bg-sage-pale/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-dark" />
              </Link>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-dark">
                  Edit Memorial
                </h1>
                <p className="text-sm text-gray-body">
                  {firstName} {lastName}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? "bg-sage text-white"
                  : "bg-white text-gray-body hover:bg-sage-pale/30"
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Basic Info Section */}
        {activeSection === "basic" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-serif font-bold text-gray-dark mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-sage" />
                Basic Information
              </h2>

              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                      required
                    />
                  </div>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="How they were known to family and friends"
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Death Date
                    </label>
                    <input
                      type="date"
                      value={deathDate}
                      onChange={(e) => setDeathDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                </div>

                {/* Places */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Birth Place
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="City, State/Country"
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Resting Place
                    </label>
                    <input
                      type="text"
                      value={restingPlace}
                      onChange={(e) => setRestingPlace(e.target.value)}
                      placeholder="Cemetery name, City"
                      className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                    />
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    Privacy Level
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: "public", label: "Public", desc: "Anyone can find and view" },
                      { value: "unlisted", label: "Unlisted", desc: "Only with link" },
                      { value: "private", label: "Private", desc: "Invited only" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          privacyLevel === option.value
                            ? "border-sage bg-sage-pale/20"
                            : "border-sage-pale/50 hover:bg-sage-pale/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="privacy"
                          value={option.value}
                          checked={privacyLevel === option.value}
                          onChange={(e) => {
                            setPrivacyLevel(e.target.value);
                            setIsPublic(e.target.value === "public");
                          }}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium text-gray-dark">{option.label}</span>
                          <p className="text-xs text-gray-body">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Biography Section */}
        {activeSection === "bio" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-gray-dark flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sage" />
                  Biography / Obituary
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiModal(true)}
                  disabled={isGeneratingBio}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100"
                >
                  {isGeneratingBio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 text-purple-600" />
                  )}
                  <span className="text-purple-700">Generate with AI</span>
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  Tell their story
                </label>
                <textarea
                  value={obituary}
                  onChange={(e) => setObituary(e.target.value)}
                  placeholder="Share their life story, accomplishments, and what made them special..."
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                  disabled={isGeneratingBio}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-body">
                    {obituary.length} characters
                  </p>
                  {obituary.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAiLength("shorter" as never);
                          handleGenerateObituary();
                        }}
                        disabled={isGeneratingBio}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Make shorter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAiLength("longer" as never);
                          handleGenerateObituary();
                        }}
                        disabled={isGeneratingBio}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Make longer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Photos Section */}
        {activeSection === "photos" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile & Cover Photos */}
            <Card className="p-6">
              <h2 className="text-lg font-serif font-bold text-gray-dark mb-6 flex items-center gap-2">
                <Camera className="w-5 h-5 text-sage" />
                Profile & Cover Photos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                  {profilePhotoUrl && (
                    <div className="mt-3 relative w-24 h-24 rounded-full overflow-hidden border-2 border-sage-pale">
                      <Image
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                        onError={() => setProfilePhotoUrl("")}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    Cover Photo URL
                  </label>
                  <input
                    type="url"
                    value={coverPhotoUrl}
                    onChange={(e) => setCoverPhotoUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                  {coverPhotoUrl && (
                    <div className="mt-3 relative w-full h-24 rounded-lg overflow-hidden border-2 border-sage-pale">
                      <Image
                        src={coverPhotoUrl}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        onError={() => setCoverPhotoUrl("")}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Photo Gallery */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-gray-dark flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-sage" />
                  Photo Gallery
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPhoto(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Photo
                </Button>
              </div>

              {/* Add Photo Form */}
              {showAddPhoto && (
                <div className="mb-6 p-4 bg-sage-pale/20 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-dark">Add New Photo</h3>
                    <button
                      onClick={() => setShowAddPhoto(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        Photo URL *
                      </label>
                      <input
                        type="url"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-1">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={newPhotoCaption}
                          onChange={(e) => setNewPhotoCaption(e.target.value)}
                          placeholder="Describe this photo"
                          className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-1">
                          Date Taken
                        </label>
                        <input
                          type="date"
                          value={newPhotoDate}
                          onChange={(e) => setNewPhotoDate(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddPhoto} size="sm">
                      Add Photo
                    </Button>
                  </div>
                </div>
              )}

              {/* Photo Grid */}
              {photos.length === 0 ? (
                <div className="text-center py-12 text-gray-body">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No photos added yet</p>
                  <p className="text-sm">Click &quot;Add Photo&quot; to start building the gallery</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-sage-pale"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption || "Memorial photo"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {/* AI Enhancement Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnhancePhoto(photo.id, "restore")}
                            disabled={isEnhancingPhoto === photo.id}
                            className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50"
                            title="Restore photo (AI)"
                          >
                            {isEnhancingPhoto === photo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Maximize className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEnhancePhoto(photo.id, "colorize")}
                            disabled={isEnhancingPhoto === photo.id}
                            className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50"
                            title="Colorize photo (AI)"
                          >
                            <Paintbrush className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Remove photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-white text-xs">AI: Restore | Colorize</p>
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2">
                          <p className="text-white text-xs truncate">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Theme Section */}
        {activeSection === "theme" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-serif font-bold text-gray-dark mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-sage" />
                Memorial Theme
              </h2>

              <p className="text-gray-body mb-6">
                Choose a theme that reflects their personality and spirit.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((themeOption) => (
                  <button
                    key={themeOption.key}
                    onClick={() => setTheme(themeOption.key)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      theme === themeOption.key
                        ? "border-sage bg-sage-pale/30 shadow-md"
                        : "border-gray-200 hover:border-sage-light hover:bg-gray-50"
                    }`}
                  >
                    {theme === themeOption.key && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sage flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-lg ${themeOption.color} flex items-center justify-center mb-3`}>
                      <themeOption.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-dark block">{themeOption.name}</span>
                    <span className="text-xs text-gray-500">{themeOption.description}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end gap-4">
          <Link href={`/memorial/${memorialId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </main>

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-dark">
                    AI Obituary Writer
                  </h3>
                  <p className="text-sm text-gray-body">
                    Help me write a heartfelt tribute
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  What made them special? Their personality traits?
                </label>
                <textarea
                  value={aiPersonality}
                  onChange={(e) => setAiPersonality(e.target.value)}
                  placeholder="e.g., Kind, generous, always had a warm smile, loved to tell jokes..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  A favorite memory or something they loved?
                </label>
                <textarea
                  value={aiBestMemory}
                  onChange={(e) => setAiBestMemory(e.target.value)}
                  placeholder="e.g., Sunday dinners with family, their famous apple pie, teaching grandchildren to fish..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  How do you want them to be remembered?
                </label>
                <textarea
                  value={aiLegacy}
                  onChange={(e) => setAiLegacy(e.target.value)}
                  placeholder="e.g., As someone who made everyone feel welcome, who never gave up..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    Tone
                  </label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="casual">Warm & Personal</option>
                    <option value="formal">Traditional</option>
                    <option value="religious">Faith-based</option>
                    <option value="celebration">Celebration of Life</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    Length
                  </label>
                  <select
                    value={aiLength}
                    onChange={(e) => setAiLength(e.target.value as typeof aiLength)}
                    className="w-full px-4 py-2 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="short">Short (1-2 paragraphs)</option>
                    <option value="medium">Medium (3-4 paragraphs)</option>
                    <option value="long">Long (detailed story)</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  The AI will use the name, dates, and places from the Basic Info section along with your prompts above.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAiModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={handleGenerateObituary}
                  disabled={isGeneratingBio}
                >
                  {isGeneratingBio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Obituary
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
