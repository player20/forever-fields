"use client";

import { useState } from "react";
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
  MapPin,
  Heart,
  Check,
  Flower2,
  Sparkles,
  FileText,
} from "lucide-react";
import { ObituaryWriter } from "@/components/ai/ObituaryWriter";

// Step definitions - simplified from 6 to 4 steps
// Photos and Invite Family moved to post-creation flow
const steps = [
  { id: 1, title: "Who", icon: User },
  { id: 2, title: "When", icon: Calendar },
  { id: 3, title: "Story", icon: FileText },
  { id: 4, title: "Review", icon: Check },
];

// Memorial types
const memorialTypes = [
  { id: "human", label: "Person", icon: "👤", description: "Honor a loved one" },
  { id: "pet", label: "Pet", icon: "🐾", description: "Remember a beloved companion" },
];

// Human relationship options
const humanRelationships = [
  "Parent",
  "Grandparent",
  "Sibling",
  "Spouse",
  "Child",
  "Aunt/Uncle",
  "Cousin",
  "Friend",
  "Other",
];

// Pet relationship options
const petRelationships = [
  "My Pet",
  "Family Pet",
  "Childhood Pet",
  "Other",
];

// Pet types
const petTypes = [
  { id: "dog", label: "Dog", icon: "🐕" },
  { id: "cat", label: "Cat", icon: "🐈" },
  { id: "bird", label: "Bird", icon: "🦜" },
  { id: "fish", label: "Fish", icon: "🐠" },
  { id: "rabbit", label: "Rabbit", icon: "🐰" },
  { id: "hamster", label: "Hamster", icon: "🐹" },
  { id: "horse", label: "Horse", icon: "🐴" },
  { id: "other", label: "Other", icon: "🐾" },
];

export default function CreateMemorialPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collapsible section state
  const [showOptionalName, setShowOptionalName] = useState(false);
  const [showOptionalLocation, setShowOptionalLocation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Memorial Type
    memorialType: "human" as "human" | "pet",
    petType: "",
    // Basic Info
    firstName: "",
    middleName: "",
    lastName: "",
    nickname: "",
    relationship: "",
    // Dates & Location
    birthDate: "",
    deathDate: "",
    birthPlace: "",
    restingPlace: "",
    // Obituary/Story
    obituary: "",
    // Settings (defaults to private)
    isPublic: false,
  });

  // Get the right relationships based on memorial type
  const relationships = formData.memorialType === "pet" ? petRelationships : humanRelationships;

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Demo mode - enable when backend is not configured
  const DEMO_MODE = true;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Demo mode - simulate successful creation
    if (DEMO_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
      const demoSlug = `${formData.firstName.toLowerCase()}-${
        formData.memorialType === "human"
          ? formData.lastName.toLowerCase()
          : formData.petType
      }-demo`.replace(/[^a-z0-9]+/g, "-");

      toast.success("Memorial created successfully! (Demo Mode)");
      toast.info("In production, this would save to the database and redirect to the memorial page.");

      // Reset form for demo
      setIsSubmitting(false);
      setCurrentStep(1);
      return;
    }

    try {
      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memorialType: formData.memorialType,
          petType: formData.memorialType === "pet" ? formData.petType : null,
          firstName: formData.firstName,
          middleName: formData.memorialType === "human" ? formData.middleName : null,
          lastName: formData.memorialType === "human" ? formData.lastName : formData.lastName, // For pets, this stores breed
          nickname: formData.nickname,
          birthDate: formData.birthDate,
          deathDate: formData.deathDate,
          birthPlace: formData.birthPlace,
          restingPlace: formData.restingPlace,
          obituary: formData.obituary,
          isPublic: formData.isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create memorial");
      }

      toast.success("Memorial created successfully!");
      router.push(`/memorial/${data.slug}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create memorial";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Who
        if (formData.memorialType === "pet") {
          // Pets need: name, pet type, and relationship
          return formData.firstName && formData.petType && formData.relationship;
        }
        // Humans need: first name, last name, and relationship
        return formData.firstName && formData.lastName && formData.relationship;
      case 2: // When
        return formData.birthDate && formData.deathDate;
      case 3: // Story
        return true; // Story/obituary is optional
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

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
                  Create a Memorial
                </h1>
                <p className="text-gray-body text-sm">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
              <Badge variant="outline" pill>
                <Sparkles className="w-4 h-4 mr-1" />
                AI-Assisted
              </Badge>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? "bg-sage border-sage text-white"
                        : currentStep === step.id
                        ? "border-sage text-sage bg-sage-pale"
                        : "border-gray-200 text-gray-400 bg-white"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm hidden sm:block ${
                      currentStep >= step.id ? "text-gray-dark" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-0.5 mx-2 ${
                        currentStep > step.id ? "bg-sage" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
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
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <User className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Basic Information
                      </h2>
                      <p className="text-sm text-gray-body">
                        Tell us about your loved one
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Memorial Type Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-3">
                        Who are you creating a memorial for? *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {memorialTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              updateFormData("memorialType", type.id);
                              // Reset relationship when switching types
                              updateFormData("relationship", "");
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
                            <span className="text-2xl mb-2 block">{type.icon}</span>
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

                    {/* Pet Type Selector (only for pets) */}
                    {formData.memorialType === "pet" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-3">
                          What type of pet? *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {petTypes.map((pet) => (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => updateFormData("petType", pet.id)}
                              className={`p-3 rounded-lg border text-center transition-all focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 ${
                                formData.petType === pet.id
                                  ? "border-sage bg-sage-pale text-sage-dark"
                                  : "border-sage-pale hover:border-sage hover:bg-sage-pale/50"
                              }`}
                            >
                              <span className="text-xl block mb-1">{pet.icon}</span>
                              <span className="text-xs">{pet.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required name fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          {formData.memorialType === "pet" ? "Pet's Name *" : "First Name *"}
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            updateFormData("firstName", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder={formData.memorialType === "pet" ? "Pet's name" : "First name"}
                        />
                      </div>
                      {formData.memorialType === "human" ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Last Name *
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
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-dark mb-2">
                            Breed/Species
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              updateFormData("lastName", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                            placeholder="e.g., Golden Retriever"
                          />
                        </div>
                      )}
                    </div>

                    {/* Optional name fields - collapsible */}
                    {!showOptionalName && (
                      <button
                        type="button"
                        onClick={() => setShowOptionalName(true)}
                        className="text-sage hover:text-sage-dark text-sm font-medium"
                      >
                        + Add middle name or nickname
                      </button>
                    )}

                    {showOptionalName && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {formData.memorialType === "human" && (
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
                        )}
                        <div className={formData.memorialType === "pet" ? "sm:col-span-2" : ""}>
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
                            placeholder={formData.memorialType === "pet" ? "Any special names?" : "What did you call them?"}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Your Relationship *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {relationships.map((rel) => (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => updateFormData("relationship", rel)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 ${
                              formData.relationship === rel
                                ? "border-sage bg-sage-pale text-sage-dark"
                                : "border-sage-pale hover:border-sage hover:bg-sage-pale/50"
                            }`}
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 2: Dates & Location */}
              {currentStep === 2 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Important Dates
                      </h2>
                      <p className="text-sm text-gray-body">
                        {formData.memorialType === "pet"
                          ? "When your companion was with you"
                          : "When they lived"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          {formData.memorialType === "pet"
                            ? "Date Welcomed *"
                            : "Date of Birth *"}
                        </label>
                        <input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) =>
                            updateFormData("birthDate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          Date of Passing *
                        </label>
                        <input
                          type="date"
                          value={formData.deathDate}
                          onChange={(e) =>
                            updateFormData("deathDate", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Optional location fields - collapsible */}
                    {!showOptionalLocation && (
                      <button
                        type="button"
                        onClick={() => setShowOptionalLocation(true)}
                        className="text-sage hover:text-sage-dark text-sm font-medium flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        Add location details
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

              {/* Step 3: Their Story */}
              {currentStep === 3 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        {formData.memorialType === "pet"
                          ? "Their Story"
                          : "Their Story"}
                      </h2>
                      <p className="text-sm text-gray-body">
                        {formData.memorialType === "pet"
                          ? "Share memories of your beloved companion"
                          : "Write an obituary or life story"}
                      </p>
                    </div>
                  </div>

                  <ObituaryWriter
                    deceasedName={
                      formData.memorialType === "pet"
                        ? formData.firstName
                        : `${formData.firstName} ${formData.lastName}`
                    }
                    relationship={formData.relationship}
                    birthDate={formData.birthDate}
                    deathDate={formData.deathDate}
                    birthPlace={formData.birthPlace}
                    restingPlace={formData.restingPlace}
                    initialValue={formData.obituary}
                    onSave={(obituary) => updateFormData("obituary", obituary)}
                  />
                </Card>
              )}

              {/* Step 4: Review */}
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
                        Make sure everything looks right
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Memorial Preview */}
                    <div className="bg-sage-pale/30 rounded-xl p-6 text-center">
                      <div className="w-24 h-24 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-4">
                        {formData.memorialType === "pet" ? (
                          <span className="text-4xl">
                            {petTypes.find((p) => p.id === formData.petType)?.icon || "🐾"}
                          </span>
                        ) : (
                          <Flower2 className="w-10 h-10 text-sage" />
                        )}
                      </div>
                      {formData.memorialType === "pet" && formData.petType && (
                        <Badge variant="secondary" className="mb-2">
                          {petTypes.find((p) => p.id === formData.petType)?.icon}{" "}
                          {petTypes.find((p) => p.id === formData.petType)?.label}
                        </Badge>
                      )}
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
                      {formData.memorialType === "pet" && formData.lastName && (
                        <p className="text-gray-body text-sm">{formData.lastName}</p>
                      )}
                      {formData.nickname && (
                        <p className="text-gray-body">&ldquo;{formData.nickname}&rdquo;</p>
                      )}
                      <p className="text-gray-body mt-2">
                        {formData.birthDate &&
                          new Date(formData.birthDate).getFullYear()}{" "}
                        -{" "}
                        {formData.deathDate &&
                          new Date(formData.deathDate).getFullYear()}
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-sage-pale/50">
                        <span className="text-gray-body">Memorial Type</span>
                        <span className="font-medium text-gray-dark">
                          {formData.memorialType === "pet" ? "Pet" : "Person"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-sage-pale/50">
                        <span className="text-gray-body">Relationship</span>
                        <span className="font-medium text-gray-dark">
                          {formData.relationship}
                        </span>
                      </div>
                      {formData.memorialType === "pet" && formData.lastName && (
                        <div className="flex justify-between py-2 border-b border-sage-pale/50">
                          <span className="text-gray-body">Breed/Species</span>
                          <span className="font-medium text-gray-dark">
                            {formData.lastName}
                          </span>
                        </div>
                      )}
                      {formData.birthPlace && (
                        <div className="flex justify-between py-2 border-b border-sage-pale/50">
                          <span className="text-gray-body">
                            {formData.memorialType === "pet" ? "Origin" : "Birth Place"}
                          </span>
                          <span className="font-medium text-gray-dark">
                            {formData.birthPlace}
                          </span>
                        </div>
                      )}
                      {formData.restingPlace && (
                        <div className="flex justify-between py-2 border-b border-sage-pale/50">
                          <span className="text-gray-body">Resting Place</span>
                          <span className="font-medium text-gray-dark">
                            {formData.restingPlace}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2">
                        <span className="text-gray-body">Visibility</span>
                        <span className="font-medium text-gray-dark">
                          {formData.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="p-4 bg-sage-pale/20 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={(e) =>
                            updateFormData("isPublic", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-sage-pale text-sage focus:ring-sage"
                        />
                        <div>
                          <p className="font-medium text-gray-dark">
                            Make this memorial public
                          </p>
                          <p className="text-sm text-gray-body">
                            Anyone can find and view this memorial
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Obituary Preview */}
                    {formData.obituary && (
                      <div className="mt-6 p-4 bg-sage-pale/20 rounded-lg">
                        <h4 className="font-medium text-gray-dark mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sage" />
                          Obituary
                        </h4>
                        <p className="text-gray-body text-sm whitespace-pre-wrap">
                          {formData.obituary.length > 300
                            ? `${formData.obituary.substring(0, 300)}...`
                            : formData.obituary}
                        </p>
                        {formData.obituary.length > 300 && (
                          <p className="text-xs text-sage mt-2">
                            Full obituary will be displayed on the memorial page
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
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
    </div>
  );
}
