"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn } from "@/components/motion";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Heart,
  Check,
  Flower2,
  Sparkles,
  FileText,
  Users,
  Camera,
  X,
  Edit2,
  Eye,
  EyeOff,
  HelpCircle,
  Zap,
  Info,
  PawPrint,
  Dog,
  Cat,
  Bird,
  type LucideIcon,
} from "lucide-react";
import { ObituaryWriter } from "@/components/ai/ObituaryWriter";
import { DuplicateWarning } from "@/components/memorial/DuplicateWarning";
import { useAuth } from "@/hooks/useAuth";
import {
  ClaimRequestModal,
  ClaimRequestData,
} from "@/components/memorial/ClaimRequestModal";
import { DuplicateMatch } from "@/lib/duplicates/detection";

// =============================================================================
// CONSTANTS
// =============================================================================

// Step definitions - streamlined flow with color variety
const steps = [
  { id: 1, title: "Basics", icon: User, description: "Name & photo", color: "sage" },
  { id: 2, title: "Dates", icon: Calendar, description: "Life timeline", color: "gold" },
  { id: 3, title: "Story", icon: FileText, description: "Their memory", color: "coral" },
  { id: 4, title: "Review", icon: Check, description: "Final check", color: "sage" },
];

// Memorial types
const memorialTypes: Array<{ id: string; label: string; icon: LucideIcon; description: string }> = [
  { id: "human", label: "Person", icon: User, description: "Honor a loved one" },
  {
    id: "pet",
    label: "Pet",
    icon: PawPrint,
    description: "Remember a beloved companion",
  },
];

// Pet types - simplified, removed breed/color
const petTypes: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "dog", label: "Dog", icon: Dog },
  { id: "cat", label: "Cat", icon: Cat },
  { id: "bird", label: "Bird", icon: Bird },
  { id: "other", label: "Other", icon: PawPrint },
];

// Date precision options for fuzzy dates
const datePrecisionOptions = [
  { id: "exact", label: "Exact date" },
  { id: "month", label: "Month & year" },
  { id: "year", label: "Year only" },
  { id: "approximate", label: "Approximate" },
];

// localStorage key for draft
const DRAFT_STORAGE_KEY = "forever-fields-memorial-draft";
const DRAFT_EXPIRY_DAYS = 30;

// =============================================================================
// TYPES
// =============================================================================

interface FormData {
  memorialType: "human" | "pet";
  petType: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  // Photo
  photoFile: File | null;
  photoPreview: string | null;
  // Dates with precision
  birthDate: string;
  birthDatePrecision: "exact" | "month" | "year" | "approximate";
  birthDateApproximate: string;
  deathDate: string;
  deathDatePrecision: "exact" | "month" | "year" | "approximate";
  deathDateApproximate: string;
  // Location
  birthPlace: string;
  restingPlace: string;
  // Story
  obituary: string;
  // Settings
  isPublic: boolean;
}

interface DraftData {
  formData: Omit<FormData, "photoFile">;
  savedAt: string;
  expiresAt: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CreateMemorialPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-4 = steps
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [createdMemorialName, setCreatedMemorialName] = useState("");
  const [testAsGuest, setTestAsGuest] = useState(false); // For testing guest flow

  // Collapsible section state
  const [showOptionalName, setShowOptionalName] = useState(false);
  const [showOptionalLocation, setShowOptionalLocation] = useState(false);

  // Duplicate checking state
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedMemorialForClaim, setSelectedMemorialForClaim] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    memorialType: "human",
    petType: "",
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    photoFile: null,
    photoPreview: null,
    birthDate: "",
    birthDatePrecision: "exact",
    birthDateApproximate: "",
    deathDate: "",
    deathDatePrecision: "exact",
    deathDateApproximate: "",
    birthPlace: "",
    restingPlace: "",
    obituary: "",
    isPublic: false,
  });

  // =============================================================================
  // DRAFT SAVE/RESTORE
  // =============================================================================

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        const now = new Date();
        const expiresAt = new Date(draft.expiresAt);

        if (now < expiresAt && draft.formData.firstName) {
          setHasDraft(true);
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save draft when form changes (debounced)
  useEffect(() => {
    if (currentStep === 0 || !formData.firstName) return;

    const timeoutId = setTimeout(() => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + DRAFT_EXPIRY_DAYS);

      // Exclude photoFile from draft (can't serialize File objects)
      const { photoFile: _photoFile, ...formDataWithoutPhoto } = formData;

      const draft: DraftData = {
        formData: formDataWithoutPhoto,
        savedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

  // Restore draft
  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...draft.formData,
          photoFile: null,
        }));
        setHasDraft(false);
        setCurrentStep(1);
        toast.success(
          `Continuing memorial for ${draft.formData.firstName}${
            draft.formData.lastName ? ` ${draft.formData.lastName}` : ""
          }`
        );
      } catch {
        toast.error("Could not restore draft");
      }
    }
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  };

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Photo upload handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Photo must be under 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        updateFormData("photoPreview", event.target?.result as string);
        updateFormData("photoFile", file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateFormData("photoFile", null);
    updateFormData("photoPreview", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =============================================================================
  // DUPLICATE CHECK
  // =============================================================================

  const checkForDuplicates = useCallback(async () => {
    if (formData.memorialType === "pet") {
      return { hasDuplicates: false };
    }

    setIsCheckingDuplicates(true);

    try {
      const response = await fetch("/api/memorials/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          birthDate: formData.birthDate,
          deathDate: formData.deathDate,
          birthPlace: formData.birthPlace,
          restingPlace: formData.restingPlace,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check for duplicates");
      }

      const data = await response.json();
      setDuplicateMatches(data.matches || []);

      return { hasDuplicates: (data.matches || []).length > 0 };
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return { hasDuplicates: false };
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, [formData]);

  // Handle claiming an existing memorial
  const handleClaimExisting = (memorialId: string) => {
    const match = duplicateMatches.find((m) => m.memorial.id === memorialId);
    if (match) {
      setSelectedMemorialForClaim({
        id: memorialId,
        name: `${match.memorial.firstName} ${match.memorial.lastName}`,
      });
      setShowClaimModal(true);
      setShowDuplicateModal(false);
    }
  };

  // Submit claim request
  const submitClaimRequest = async (data: ClaimRequestData) => {
    try {
      const response = await fetch("/api/memorials/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit claim request");
      }

      toast.success(
        "Access request submitted! The memorial owner will be notified."
      );
      setShowClaimModal(false);
      clearDraft();
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit request";
      toast.error(message);
    }
  };

  // =============================================================================
  // NAVIGATION
  // =============================================================================

  const nextStep = async () => {
    // Moving from step 2 to step 3, check for duplicates
    if (currentStep === 2 && formData.memorialType === "human") {
      const result = await checkForDuplicates();
      if (result.hasDuplicates) {
        setShowDuplicateModal(true);
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || canProceed()) {
      setCurrentStep(step);
    }
  };

  // =============================================================================
  // SUBMISSION
  // =============================================================================

  const DEMO_MODE = true;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const memorialName = formData.memorialType === "pet"
      ? formData.firstName
      : `${formData.firstName} ${formData.lastName}`;

    if (DEMO_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // If user is not authenticated OR testing as guest, prompt them to sign up
      if (!isAuthenticated || testAsGuest) {
        setCreatedMemorialName(memorialName);
        setShowSignupPrompt(true);
        setIsSubmitting(false);
        return;
      }

      toast.success("Memorial created successfully! (Demo Mode)");
      clearDraft();
      setIsSubmitting(false);
      router.push("/dashboard");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "photoFile" && value) {
          formDataToSend.append("photo", value as File);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      const response = await fetch("/api/memorials", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create memorial");
      }

      toast.success("Memorial created successfully!");
      clearDraft();
      router.push(`/memorial/${data.slug}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create memorial";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  // Quick create - minimal flow
  const handleQuickCreate = async () => {
    setIsSubmitting(true);

    const memorialName = formData.memorialType === "pet"
      ? formData.firstName
      : `${formData.firstName} ${formData.lastName}`;

    if (DEMO_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If user is not authenticated OR testing as guest, prompt them to sign up
      if (!isAuthenticated || testAsGuest) {
        setCreatedMemorialName(memorialName);
        setShowQuickCreate(false);
        setShowSignupPrompt(true);
        setIsSubmitting(false);
        return;
      }

      toast.success("Memorial created! (Demo Mode)");
      toast.info("You can add photos, stories, and more anytime.");
      clearDraft();
      setIsSubmitting(false);
      setShowQuickCreate(false);
      router.push("/dashboard");
      return;
    }

    // In production, submit minimal data
    handleSubmit();
  };

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: // Basics
        if (formData.memorialType === "pet") {
          return Boolean(formData.firstName && formData.petType);
        }
        return Boolean(formData.firstName && formData.lastName);
      case 2: // Dates
        return Boolean(getFormattedDate("birth") && getFormattedDate("death"));
      case 3: // Story
        return true; // Optional
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  // =============================================================================
  // DATE FORMATTING
  // =============================================================================

  const getFormattedDate = (type: "birth" | "death"): string => {
    const date = type === "birth" ? formData.birthDate : formData.deathDate;
    const precision =
      type === "birth"
        ? formData.birthDatePrecision
        : formData.deathDatePrecision;
    const approximate =
      type === "birth"
        ? formData.birthDateApproximate
        : formData.deathDateApproximate;

    if (precision === "approximate" && approximate) {
      return `c. ${approximate}`;
    }

    if (!date) return "";

    const dateObj = new Date(date);

    switch (precision) {
      case "exact":
        return dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "month":
        return dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "year":
        return dateObj.getFullYear().toString();
      default:
        return date;
    }
  };

  const getDateDisplay = (type: "birth" | "death"): string => {
    const formatted = getFormattedDate(type);
    if (!formatted) return "Not set";
    return formatted;
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Intro screen (step 0)
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />

        <section className="py-12 md:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              {/* Emotional intro */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-sage" />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-dark mb-4">
                  Create a Memorial
                </h1>
                <p className="text-lg text-gray-body max-w-md mx-auto">
                  Creating a memorial is a meaningful way to celebrate a life.
                  Take all the time you need—you can always add more later.
                </p>
              </div>

              {/* Draft restoration banner */}
              {hasDraft && (
                <Card className="mb-8 p-4 border-sage bg-sage-pale/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-sage" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-dark">
                          Continue where you left off?
                        </p>
                        <p className="text-sm text-gray-body">
                          You have an unfinished memorial
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={clearDraft}>
                        Start Fresh
                      </Button>
                      <Button size="sm" onClick={restoreDraft}>
                        Continue
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Main options */}
              <div className="space-y-4">
                {/* Standard flow */}
                <Card
                  className="p-6 cursor-pointer hover:border-sage transition-colors group"
                  onClick={() => setCurrentStep(1)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-pale flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                      <Sparkles className="w-6 h-6 text-sage" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-dark mb-1">
                        Guided Creation
                      </h3>
                      <p className="text-sm text-gray-body">
                        Step-by-step process with AI assistance for writing
                        their story
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-sage transition-colors" />
                  </div>
                </Card>

                {/* Quick create */}
                <Card
                  className="p-6 cursor-pointer hover:border-sage transition-colors group"
                  onClick={() => setShowQuickCreate(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sage-pale flex items-center justify-center group-hover:bg-sage/20 transition-colors">
                      <Zap className="w-6 h-6 text-sage" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-dark mb-1">
                        Quick Create
                      </h3>
                      <p className="text-sm text-gray-body">
                        Just name and dates—add everything else later
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-sage transition-colors" />
                  </div>
                </Card>
              </div>

              {/* Reassurance */}
              <div className="mt-8 p-4 bg-sage-pale/30 rounded-lg border border-sage-pale">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-body">
                    <p className="font-medium text-gray-dark mb-1">
                      Your progress is saved automatically
                    </p>
                    <p>
                      If you need to step away, your work will be here when you
                      return. Private by default—only you can see it until you
                      choose to share.
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Mode Toggle - for local testing */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testAsGuest}
                    onChange={(e) => setTestAsGuest(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-amber-800">Test as Guest</span>
                    <span className="text-amber-600 ml-2">
                      (Shows signup prompt after creating memorial)
                    </span>
                  </div>
                </label>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Quick Create Modal */}
        <AnimatePresence>
          {showQuickCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowQuickCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-semibold text-gray-dark">
                    Quick Create
                  </h2>
                  <button
                    onClick={() => setShowQuickCreate(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Memorial type toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateFormData("memorialType", "human")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-colors flex items-center justify-center gap-2 ${
                        formData.memorialType === "human"
                          ? "border-sage bg-sage-pale text-sage-dark"
                          : "border-gray-200 hover:border-sage"
                      }`}
                    >
                      <User className="w-4 h-4" /> Person
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData("memorialType", "pet")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-colors flex items-center justify-center gap-2 ${
                        formData.memorialType === "pet"
                          ? "border-sage bg-sage-pale text-sage-dark"
                          : "border-gray-200 hover:border-sage"
                      }`}
                    >
                      <PawPrint className="w-4 h-4" /> Pet
                    </button>
                  </div>

                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={formData.memorialType === "pet" ? "col-span-2" : ""}>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          updateFormData("firstName", e.target.value)
                        }
                        placeholder={
                          formData.memorialType === "pet"
                            ? "Pet's name"
                            : "First name"
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      />
                    </div>
                    {formData.memorialType === "human" && (
                      <div>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) =>
                            updateFormData("lastName", e.target.value)
                          }
                          placeholder="Last name"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pet type for pets */}
                  {formData.memorialType === "pet" && (
                    <div className="flex gap-2">
                      {petTypes.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => updateFormData("petType", pet.id)}
                          className={`flex-1 py-2 px-3 rounded-lg border text-center transition-colors ${
                            formData.petType === pet.id
                              ? "border-sage bg-sage-pale"
                              : "border-gray-200 hover:border-sage"
                          }`}
                        >
                          <pet.icon className="w-5 h-5 mx-auto" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Year fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Born / Welcomed
                      </label>
                      <input
                        type="text"
                        value={formData.birthDateApproximate}
                        onChange={(e) => {
                          updateFormData("birthDateApproximate", e.target.value);
                          updateFormData("birthDatePrecision", "approximate");
                        }}
                        placeholder="e.g., 1945"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Passed
                      </label>
                      <input
                        type="text"
                        value={formData.deathDateApproximate}
                        onChange={(e) => {
                          updateFormData("deathDateApproximate", e.target.value);
                          updateFormData("deathDatePrecision", "approximate");
                        }}
                        placeholder="e.g., 2024"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleQuickCreate}
                    disabled={
                      isSubmitting ||
                      !formData.firstName ||
                      (formData.memorialType === "human" && !formData.lastName) ||
                      (formData.memorialType === "pet" && !formData.petType)
                    }
                    className="w-full"
                  >
                    {isSubmitting ? "Creating..." : "Create Memorial"}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    You can add photos, stories, and more anytime
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Progress Header */}
      <section className="bg-white border-b border-sage-pale/50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-dark">
                  {formData.firstName
                    ? `Memorial for ${formData.firstName}`
                    : "Create a Memorial"}
                </h1>
                <p className="text-gray-body text-sm">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
              <Badge variant="outline" pill>
                <Sparkles className="w-4 h-4 mr-1" />
                Auto-saved
              </Badge>
            </div>

            {/* Supportive Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const colorClasses = {
                  completed: step.color === "gold" ? "bg-gold border-gold" : step.color === "coral" ? "bg-coral border-coral" : "bg-sage border-sage",
                  active: step.color === "gold" ? "border-gold text-gold-dark bg-gold-pale" : step.color === "coral" ? "border-coral text-coral-dark bg-coral-pale" : "border-sage text-sage-dark bg-sage-pale",
                  hover: step.color === "gold" ? "hover:border-gold" : step.color === "coral" ? "hover:border-coral" : "hover:border-sage",
                  line: step.color === "gold" ? "bg-gold" : step.color === "coral" ? "bg-coral" : "bg-sage",
                };
                return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > currentStep && !canProceed()}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? `${colorClasses.completed} text-white cursor-pointer`
                        : currentStep === step.id
                        ? colorClasses.active
                        : "border-gray-200 text-gray-400 bg-white"
                    } ${
                      step.id <= currentStep || canProceed()
                        ? colorClasses.hover
                        : ""
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </button>
                  <div className="ml-2 hidden sm:block">
                    <span
                      className={`text-sm block ${
                        currentStep >= step.id ? "text-gray-dark" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {step.description}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 ${
                        currentStep > step.id ? colorClasses.line : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              )})}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* =============================================================================
                  STEP 1: BASICS (Name & Photo)
                  ============================================================================= */}
              {currentStep === 1 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <User className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Tell us about them
                      </h2>
                      <p className="text-sm text-gray-body">
                        Start with a name—you can add more anytime
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Memorial Type Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        Who is this memorial for?
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {memorialTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              updateFormData(
                                "memorialType",
                                type.id as "human" | "pet"
                              );
                              if (type.id === "human") {
                                updateFormData("petType", "");
                              }
                            }}
                            className={`p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 ${
                              formData.memorialType === type.id
                                ? "border-sage bg-sage-pale ring-2 ring-sage/20"
                                : "border-sage-pale hover:border-sage hover:bg-sage-pale/30"
                            }`}
                          >
                            <type.icon className="w-6 h-6 mb-2" />
                            <span className="font-medium text-gray-dark block">
                              {type.label}
                            </span>
                            <span className="text-sm text-gray-body">
                              {type.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pet Type (only for pets) */}
                    {formData.memorialType === "pet" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-3">
                          What type of companion?
                        </label>
                        <div className="flex gap-2">
                          {petTypes.map((pet) => (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => updateFormData("petType", pet.id)}
                              className={`flex-1 p-3 rounded-lg border text-center transition-all focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 ${
                                formData.petType === pet.id
                                  ? "border-sage bg-sage-pale text-sage-dark"
                                  : "border-sage-pale hover:border-sage hover:bg-sage-pale/50"
                              }`}
                            >
                              <pet.icon className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs">{pet.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        Add a photo{" "}
                        <span className="text-gray-400 font-normal">
                          (optional)
                        </span>
                      </label>

                      {formData.photoPreview ? (
                        <div className="relative w-32 h-32 mx-auto">
                          <img
                            src={formData.photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full border-4 border-sage-pale"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full p-8 border-2 border-dashed border-sage-pale rounded-xl hover:border-sage hover:bg-sage-pale/20 transition-colors text-center group"
                        >
                          <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-3 group-hover:bg-sage/20 transition-colors">
                            <Camera className="w-8 h-8 text-sage" />
                          </div>
                          <p className="text-gray-dark font-medium">
                            Click to add a photo
                          </p>
                          <p className="text-sm text-gray-body mt-1">
                            Memorials with photos receive more visits
                          </p>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Name Fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className={formData.memorialType === "pet" ? "sm:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          {formData.memorialType === "pet"
                            ? "Pet's Name"
                            : "First Name"}
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            updateFormData("firstName", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder={
                            formData.memorialType === "pet"
                              ? "What did you call them?"
                              : "First name"
                          }
                        />
                      </div>
                      {formData.memorialType === "human" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              updateFormData("lastName", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                            placeholder="Last name"
                          />
                        </div>
                      )}
                    </div>

                    {/* Optional name fields */}
                    {!showOptionalName && formData.memorialType === "human" && (
                      <button
                        type="button"
                        onClick={() => setShowOptionalName(true)}
                        className="text-sage hover:text-sage-dark text-sm font-medium"
                      >
                        + Add middle name or nickname
                      </button>
                    )}

                    {showOptionalName && formData.memorialType === "human" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            value={formData.middleName}
                            onChange={(e) =>
                              updateFormData("middleName", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                            placeholder="Middle name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Nickname
                          </label>
                          <input
                            type="text"
                            value={formData.nickname}
                            onChange={(e) =>
                              updateFormData("nickname", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                            placeholder="What did loved ones call them?"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* =============================================================================
                  STEP 2: DATES (with fuzzy date support)
                  ============================================================================= */}
              {currentStep === 2 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Life Timeline
                      </h2>
                      <p className="text-sm text-gray-body">
                        Don&apos;t worry if you don&apos;t know exact dates—approximate is fine
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        {formData.memorialType === "pet"
                          ? "When did you welcome them?"
                          : "Date of Birth"}
                      </label>

                      {/* Precision selector */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {datePrecisionOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              updateFormData(
                                "birthDatePrecision",
                                option.id as FormData["birthDatePrecision"]
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              formData.birthDatePrecision === option.id
                                ? "bg-sage text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {/* Date input based on precision */}
                      {formData.birthDatePrecision === "approximate" ? (
                        <input
                          type="text"
                          value={formData.birthDateApproximate}
                          onChange={(e) =>
                            updateFormData("birthDateApproximate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="e.g., Around 1945, Early 1950s, Before 1960"
                        />
                      ) : formData.birthDatePrecision === "year" ? (
                        <input
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={formData.birthDate ? new Date(formData.birthDate).getFullYear() : ""}
                          onChange={(e) =>
                            updateFormData("birthDate", `${e.target.value}-01-01`)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="Year (e.g., 1945)"
                        />
                      ) : formData.birthDatePrecision === "month" ? (
                        <input
                          type="month"
                          value={formData.birthDate ? formData.birthDate.substring(0, 7) : ""}
                          onChange={(e) =>
                            updateFormData("birthDate", `${e.target.value}-01`)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) =>
                            updateFormData("birthDate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      )}
                    </div>

                    {/* Death Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        Date of Passing
                      </label>

                      {/* Precision selector */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {datePrecisionOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              updateFormData(
                                "deathDatePrecision",
                                option.id as FormData["deathDatePrecision"]
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              formData.deathDatePrecision === option.id
                                ? "bg-sage text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {/* Date input based on precision */}
                      {formData.deathDatePrecision === "approximate" ? (
                        <input
                          type="text"
                          value={formData.deathDateApproximate}
                          onChange={(e) =>
                            updateFormData("deathDateApproximate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="e.g., December 2023, Late 2024"
                        />
                      ) : formData.deathDatePrecision === "year" ? (
                        <input
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={formData.deathDate ? new Date(formData.deathDate).getFullYear() : ""}
                          onChange={(e) =>
                            updateFormData("deathDate", `${e.target.value}-01-01`)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="Year (e.g., 2024)"
                        />
                      ) : formData.deathDatePrecision === "month" ? (
                        <input
                          type="month"
                          value={formData.deathDate ? formData.deathDate.substring(0, 7) : ""}
                          onChange={(e) =>
                            updateFormData("deathDate", `${e.target.value}-01`)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="date"
                          value={formData.deathDate}
                          onChange={(e) =>
                            updateFormData("deathDate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      )}
                    </div>

                    {/* Optional location fields */}
                    {!showOptionalLocation && (
                      <button
                        type="button"
                        onClick={() => setShowOptionalLocation(true)}
                        className="text-sage hover:text-sage-dark text-sm font-medium flex items-center gap-1"
                      >
                        + Add location details
                      </button>
                    )}

                    {showOptionalLocation && (
                      <div className="space-y-4 p-4 bg-sage-pale/20 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            {formData.memorialType === "pet"
                              ? "Where did they come from?"
                              : "Place of Birth"}
                          </label>
                          <input
                            type="text"
                            value={formData.birthPlace}
                            onChange={(e) =>
                              updateFormData("birthPlace", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent bg-white"
                            placeholder={
                              formData.memorialType === "pet"
                                ? "Breeder, shelter, etc."
                                : "City, State/Country"
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Final Resting Place
                          </label>
                          <input
                            type="text"
                            value={formData.restingPlace}
                            onChange={(e) =>
                              updateFormData("restingPlace", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent bg-white"
                            placeholder={
                              formData.memorialType === "pet"
                                ? "Pet cemetery, home garden, etc."
                                : "Cemetery name, City"
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* =============================================================================
                  STEP 3: STORY (with reframed AI assistance)
                  ============================================================================= */}
              {currentStep === 3 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Share Their Story
                      </h2>
                      <p className="text-sm text-gray-body">
                        This is optional—you can always add or edit later
                      </p>
                    </div>
                  </div>

                  {/* Gentle prompt, not demanding */}
                  <div className="mb-6 p-4 bg-sage-pale/30 rounded-lg border border-sage-pale">
                    <p className="text-sm text-gray-body">
                      <span className="font-medium text-gray-dark">
                        No pressure.
                      </span>{" "}
                      Write as much or as little as feels right. A single
                      sentence capturing who they were is enough.
                    </p>
                  </div>

                  <ObituaryWriter
                    deceasedName={
                      formData.memorialType === "pet"
                        ? formData.firstName
                        : `${formData.firstName} ${formData.lastName}`
                    }
                    relationship=""
                    birthDate={formData.birthDate}
                    deathDate={formData.deathDate}
                    birthPlace={formData.birthPlace}
                    restingPlace={formData.restingPlace}
                    initialValue={formData.obituary}
                    onSave={(obituary) => updateFormData("obituary", obituary)}
                  />

                  {/* Skip option */}
                  {!formData.obituary && (
                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Skip for now—I&apos;ll add this later
                      </button>
                    </div>
                  )}
                </Card>
              )}

              {/* =============================================================================
                  STEP 4: REVIEW (card-based with edit buttons)
                  ============================================================================= */}
              {currentStep === 4 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <Check className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Review & Create
                      </h2>
                      <p className="text-sm text-gray-body">
                        Everything look right? You can edit anytime after creating.
                      </p>
                    </div>
                  </div>

                  {/* Memorial Preview Card */}
                  <div className="bg-sage-pale/30 rounded-xl p-6 text-center mb-6">
                    {/* Photo or placeholder */}
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
                      {formData.photoPreview ? (
                        <img
                          src={formData.photoPreview}
                          alt={formData.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-sage-pale flex items-center justify-center">
                          {formData.memorialType === "pet" ? (
                            (() => {
                              const PetIcon = petTypes.find((p) => p.id === formData.petType)?.icon || PawPrint;
                              return <PetIcon className="w-10 h-10 text-sage" />;
                            })()
                          ) : (
                            <Flower2 className="w-10 h-10 text-sage" />
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-serif font-bold text-gray-dark">
                      {formData.memorialType === "pet" ? (
                        formData.firstName
                      ) : (
                        <>
                          {formData.firstName}{" "}
                          {formData.middleName && `${formData.middleName} `}
                          {formData.lastName}
                        </>
                      )}
                    </h3>
                    {formData.nickname && (
                      <p className="text-gray-body">
                        &ldquo;{formData.nickname}&rdquo;
                      </p>
                    )}
                    <p className="text-gray-body mt-2">
                      {getDateDisplay("birth")} — {getDateDisplay("death")}
                    </p>
                  </div>

                  {/* Editable Cards */}
                  <div className="space-y-3">
                    {/* Basic Info Card */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-sage-pale/50">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Basic Info
                        </p>
                        <p className="font-medium text-gray-dark">
                          {formData.memorialType === "pet"
                            ? `${formData.firstName} (${
                                petTypes.find((p) => p.id === formData.petType)
                                  ?.label || "Pet"
                              })`
                            : `${formData.firstName} ${formData.lastName}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="p-2 hover:bg-sage-pale rounded-lg transition-colors"
                        aria-label="Edit basic info"
                      >
                        <Edit2 className="w-4 h-4 text-sage" />
                      </button>
                    </div>

                    {/* Dates Card */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-sage-pale/50">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Dates
                        </p>
                        <p className="font-medium text-gray-dark">
                          {getDateDisplay("birth")} — {getDateDisplay("death")}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="p-2 hover:bg-sage-pale rounded-lg transition-colors"
                        aria-label="Edit dates"
                      >
                        <Edit2 className="w-4 h-4 text-sage" />
                      </button>
                    </div>

                    {/* Location Card (if filled) */}
                    {(formData.birthPlace || formData.restingPlace) && (
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-sage-pale/50">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Location
                          </p>
                          <p className="font-medium text-gray-dark">
                            {formData.restingPlace || formData.birthPlace}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowOptionalLocation(true);
                            setCurrentStep(2);
                          }}
                          className="p-2 hover:bg-sage-pale rounded-lg transition-colors"
                          aria-label="Edit location"
                        >
                          <Edit2 className="w-4 h-4 text-sage" />
                        </button>
                      </div>
                    )}

                    {/* Story Card (if filled) */}
                    {formData.obituary && (
                      <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-sage-pale/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Story
                          </p>
                          <p className="font-medium text-gray-dark truncate">
                            {formData.obituary.substring(0, 100)}
                            {formData.obituary.length > 100 ? "..." : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="p-2 hover:bg-sage-pale rounded-lg transition-colors shrink-0"
                          aria-label="Edit story"
                        >
                          <Edit2 className="w-4 h-4 text-sage" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Privacy Setting with Preview */}
                  <div className="mt-6 p-4 bg-sage-pale/20 rounded-lg">
                    <div className="flex items-start gap-4">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={(e) =>
                            updateFormData("isPublic", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-sage-pale text-sage focus:ring-sage"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            {formData.isPublic ? (
                              <Eye className="w-4 h-4 text-sage" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-dark">
                              {formData.isPublic
                                ? "Public memorial"
                                : "Private memorial"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-body mt-1">
                            {formData.isPublic
                              ? "Anyone can find and view this memorial"
                              : "Only people you invite can view this memorial"}
                          </p>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          toast.info(
                            formData.isPublic
                              ? "Public memorials appear in search results and can be viewed by anyone with the link."
                              : "Private memorials are only visible to you and people you specifically invite."
                          )
                        }
                        aria-label="Privacy information"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* What happens next */}
                  <div className="mt-6 p-4 border border-sage-pale rounded-lg">
                    <p className="text-sm text-gray-body">
                      <span className="font-medium text-gray-dark">
                        What happens next:
                      </span>{" "}
                      After creating, you can add photos, invite family to
                      contribute memories, and access features like AI-powered
                      storytelling.
                    </p>
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? () => setCurrentStep(0) : prevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentStep === 1 ? "Back to Start" : "Back"}
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isCheckingDuplicates}
                className="flex items-center gap-2"
              >
                {isCheckingDuplicates ? (
                  <>
                    <span className="animate-spin">
                      <Users className="w-5 h-5" />
                    </span>
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">
                      <Flower2 className="w-5 h-5" />
                    </span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    Create Memorial
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* =============================================================================
          MODALS
          ============================================================================= */}

      {/* Duplicate Found Modal - Reframed as "Connect" */}
      <AnimatePresence>
        {showDuplicateModal && duplicateMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDuplicateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-semibold text-gray-dark">
                    Connect with Family?
                  </h2>
                  <p className="text-sm text-gray-body">
                    It looks like a memorial may already exist
                  </p>
                </div>
              </div>

              <p className="text-gray-body mb-4">
                We found {duplicateMatches.length === 1 ? "a memorial" : "memorials"}{" "}
                that might be for the same person. Would you like to request
                access to contribute, or create a separate memorial?
              </p>

              <DuplicateWarning
                matches={duplicateMatches}
                onClaimExisting={handleClaimExisting}
                onCreateAnyway={() => {
                  setShowDuplicateModal(false);
                  setCurrentStep(3);
                }}
                onCancel={() => setShowDuplicateModal(false)}
                isLoading={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Request Modal */}
      <AnimatePresence>
        {showClaimModal && selectedMemorialForClaim && (
          <ClaimRequestModal
            memorialName={selectedMemorialForClaim.name}
            memorialId={selectedMemorialForClaim.id}
            onSubmit={submitClaimRequest}
            onClose={() => {
              setShowClaimModal(false);
              setSelectedMemorialForClaim(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Signup Prompt Modal - shown after creating memorial as guest */}
      <AnimatePresence>
        {showSignupPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              {/* Success icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-sage" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                  Memorial Created!
                </h2>
                <p className="text-gray-body">
                  You&apos;ve created a beautiful memorial for{" "}
                  <strong>{createdMemorialName}</strong>
                </p>
              </div>

              {/* Sign up prompt */}
              <div className="bg-sage-pale/30 rounded-lg p-4 mb-6">
                <p className="text-gray-dark text-center">
                  <strong>Create a free account</strong> to save your memorial,
                  invite family to contribute, and access all features.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    // Save draft to localStorage before redirecting
                    clearDraft();
                    router.push("/signup?redirect=/dashboard&memorial=new");
                  }}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Free Account
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    clearDraft();
                    router.push("/login?redirect=/dashboard&memorial=new");
                  }}
                  className="w-full"
                >
                  I already have an account
                </Button>

                <button
                  onClick={() => {
                    setShowSignupPrompt(false);
                    clearDraft();
                    toast.info(
                      "Your memorial was created but not saved. Create an account to save it!"
                    );
                    setCurrentStep(0);
                    setFormData({
                      memorialType: "human",
                      petType: "",
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      nickname: "",
                      photoFile: null,
                      photoPreview: null,
                      birthDate: "",
                      birthDatePrecision: "exact",
                      birthDateApproximate: "",
                      deathDate: "",
                      deathDatePrecision: "exact",
                      deathDateApproximate: "",
                      birthPlace: "",
                      restingPlace: "",
                      obituary: "",
                      isPublic: false,
                    });
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Continue without saving
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Your memorial draft is saved locally for 30 days
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
