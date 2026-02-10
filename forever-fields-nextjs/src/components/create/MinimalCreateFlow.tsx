"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { toast } from "sonner";
import {
  Camera,
  Check,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { ObituaryWriter } from "@/components/ai/ObituaryWriter";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_MODE } from "@/lib/constants";

// Minimal 2-step flow: Essentials -> Story
// Step 1: Name, dates, photo (all on one page)
// Step 2: Obituary/story (with AI help)

interface FormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  profilePhotoUrl: string | null;
  obituary: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  deathDate: "",
  profilePhotoUrl: null,
  obituary: "",
};

interface MinimalCreateFlowProps {
  onComplete?: (memorialId: string) => void;
  onTrack?: (event: string, properties?: Record<string, unknown>) => void;
}

export function MinimalCreateFlow({ onComplete, onTrack }: MinimalCreateFlowProps) {
  const router = useRouter();
  const { user, signInWithRedirect } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Track step completion
  const trackStep = useCallback(
    (stepNum: number) => {
      onTrack?.("create_step_completed", { step: stepNum, variant: "minimal" });
    },
    [onTrack]
  );

  // Handle photo upload
  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Create preview URL
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, profilePhotoUrl: url }));
    },
    []
  );

  // Validate step 1
  const isStep1Valid = formData.firstName.trim() && formData.lastName.trim();

  // Handle next step
  const handleNext = useCallback(() => {
    trackStep(step);
    setStep(2);
  }, [step, trackStep]);

  // Handle back
  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  // Handle AI obituary completion
  const handleAIComplete = useCallback((text: string) => {
    setFormData((prev) => ({ ...prev, obituary: text }));
    setShowAI(false);
  }, []);

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    // Require authentication
    if (!user) {
      toast.info("Please sign in to create your memorial", {
        description: "Your progress will be saved",
        action: {
          label: "Sign In",
          onClick: () => signInWithRedirect("/create"),
        },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (DEMO_MODE) {
        // Demo mode - simulate creation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const fakeId = `demo-${Date.now()}`;

        onTrack?.("create_memorial_success", { variant: "minimal" });
        toast.success("Memorial created successfully!");

        if (onComplete) {
          onComplete(fakeId);
        } else {
          router.push(`/memorial/${fakeId}`);
        }
        return;
      }

      // API call
      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: formData.birthDate || null,
          deathDate: formData.deathDate || null,
          profilePhotoUrl: formData.profilePhotoUrl,
          obituary: formData.obituary || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create memorial");
      }

      const data = await response.json();
      onTrack?.("create_memorial_success", { variant: "minimal" });
      toast.success("Memorial created successfully!");

      if (onComplete) {
        onComplete(data.memorial.id);
      } else {
        router.push(`/memorial/${data.memorial.slug || data.memorial.id}`);
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create memorial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, router, onComplete, onTrack, signInWithRedirect]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 1 ? "bg-sage text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {step > 1 ? <Check className="w-5 h-5" /> : "1"}
        </div>
        <div className={`h-1 w-16 ${step > 1 ? "bg-sage" : "bg-gray-200"}`} />
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 2 ? "bg-sage text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          2
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Essentials */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Create a Memorial
              </h1>
              <p className="text-gray-body mb-6">
                Start by adding the essential details about your loved one.
              </p>

              {/* Photo upload */}
              <div className="flex justify-center mb-6">
                <label className="relative cursor-pointer group">
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-sage transition-colors">
                    {formData.profilePhotoUrl ? (
                      <>
                        <Image
                          src={formData.profilePhotoUrl}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({
                              ...prev,
                              profilePhotoUrl: null,
                            }));
                          }}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400 group-hover:text-sage" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Date fields */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    Passing Date
                  </label>
                  <input
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deathDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                  />
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="w-full"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Story */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Tell Their Story
              </h1>
              <p className="text-gray-body mb-6">
                Share memories, achievements, and what made them special.
              </p>

              {/* AI Writer toggle */}
              {!showAI ? (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-dark">
                        Obituary / Life Story
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAI(true)}
                        className="text-sm text-sage hover:text-sage-dark flex items-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        Help me write
                      </button>
                    </div>
                    <textarea
                      value={formData.obituary}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          obituary: e.target.value,
                        }))
                      }
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
                      placeholder="Share their story, memories, achievements, and what made them special..."
                    />
                  </div>

                  <p className="text-sm text-gray-muted mb-6">
                    You can always edit and add more details later.
                  </p>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Create Memorial
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sage">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-medium">AI Writing Assistant</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAI(false)}
                      className="text-gray-muted hover:text-gray-dark"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <ObituaryWriter
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                    initialText={formData.obituary}
                    onComplete={handleAIComplete}
                    onCancel={() => setShowAI(false)}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
