"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { toast } from "sonner";
import {
  Flower2,
  User,
  Heart,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const RELATIONSHIP_OPTIONS = [
  { value: "parent", label: "Parent" },
  { value: "grandparent", label: "Grandparent" },
  { value: "spouse", label: "Spouse/Partner" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [oneMemory, setOneMemory] = useState("");

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1:
        return firstName.trim().length > 0;
      case 2:
        return relationship.length > 0;
      case 3:
        return true; // Memory is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateMemorial = async () => {
    setIsCreating(true);
    try {
      // Create the memorial with the gathered information
      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          relationship,
          initialMemory: oneMemory.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create memorial");
      }

      const data = await response.json();
      toast.success("Memorial created! Let's add more details.");

      // Redirect to the memorial edit page
      router.push(`/memorial/${data.memorial.slug}/edit`);
    } catch (error) {
      console.error("Error creating memorial:", error);
      toast.error("Failed to create memorial. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Flower2 className="w-8 h-8 text-sage" />
            <span className="text-2xl font-serif font-bold text-sage-dark">
              Forever Fields
            </span>
          </Link>
        </div>

        <Card className="p-8">
          {/* Progress bar */}
          <div className="mb-8" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Step ${step} of ${totalSteps}`}>
            <div className="flex justify-between text-sm text-gray-body mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-sage-pale/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sage"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-sage-pale rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-sage" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                    Who would you like to remember?
                  </h1>
                  <p className="text-gray-body">
                    Let&apos;s start by honoring their name.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      First name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Their first name"
                      className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-base"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Last name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Their last name"
                      className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-base"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-rose-pale rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-rose" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                    What was your relationship?
                  </h1>
                  <p className="text-gray-body">
                    Help us personalize {firstName}&apos;s memorial.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRelationship(option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        relationship === option.value
                          ? "border-sage bg-sage-pale/30"
                          : "border-sage-pale/50 hover:border-sage-pale"
                      }`}
                    >
                      <span className={`font-medium ${
                        relationship === option.value ? "text-sage-dark" : "text-gray-dark"
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gold-pale rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gold-dark" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                    Share a treasured memory
                  </h1>
                  <p className="text-gray-body">
                    What&apos;s one thing you loved about {firstName}?
                  </p>
                </div>

                <div>
                  <textarea
                    value={oneMemory}
                    onChange={(e) => setOneMemory(e.target.value)}
                    placeholder={`e.g., "Their infectious laugh" or "The way they always made pancakes on Sundays"`}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none text-base"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    This will become the first memory on their memorial. You can skip this for now.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateMemorial}
                disabled={isCreating || !canProceed()}
              >
                {isCreating ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Flower2 className="w-4 h-4" />
                    </span>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Memorial
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip option */}
          {step === 3 && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleCreateMemorial}
                disabled={isCreating}
                className="text-sm text-gray-body hover:text-sage"
              >
                Skip for now
              </button>
            </div>
          )}
        </Card>

        {/* Back to home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-body hover:text-sage">
            Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
