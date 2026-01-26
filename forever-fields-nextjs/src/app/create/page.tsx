"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp } from "@/components/motion";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  Heart,
  Check,
  Upload,
  X,
  Flower2,
  Sparkles,
  FileText,
} from "lucide-react";
import { ObituaryWriter } from "@/components/ai/ObituaryWriter";

// Step definitions
const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Dates & Location", icon: Calendar },
  { id: 3, title: "Photos", icon: ImageIcon },
  { id: 4, title: "Their Story", icon: FileText },
  { id: 5, title: "Invite Family", icon: Users },
  { id: 6, title: "Review", icon: Check },
];

// Relationship options
const relationships = [
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

export default function CreateMemorialPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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
    // Photos
    profilePhoto: null as File | null,
    profilePhotoPreview: "",
    additionalPhotos: [] as File[],
    // Obituary/Story
    obituary: "",
    // Family invites
    inviteEmails: [""],
    // Settings
    isPublic: false,
  });

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData("profilePhoto", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData("profilePhotoPreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addInviteEmail = () => {
    setFormData((prev) => ({
      ...prev,
      inviteEmails: [...prev.inviteEmails, ""],
    }));
  };

  const updateInviteEmail = (index: number, value: string) => {
    const newEmails = [...formData.inviteEmails];
    newEmails[index] = value;
    setFormData((prev) => ({ ...prev, inviteEmails: newEmails }));
  };

  const removeInviteEmail = (index: number) => {
    if (formData.inviteEmails.length > 1) {
      const newEmails = formData.inviteEmails.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, inviteEmails: newEmails }));
    }
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Memorial created successfully!");

    // Navigate to the new memorial (using a placeholder ID)
    router.push("/memorial/new-memorial");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.relationship;
      case 2:
        return formData.birthDate && formData.deathDate;
      case 3:
        return true; // Photos are optional
      case 4:
        return true; // Story/obituary is optional
      case 5:
        return true; // Invites are optional
      case 6:
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
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            updateFormData("firstName", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="First name"
                        />
                      </div>
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
                          placeholder="Middle name (optional)"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
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
                          placeholder="What did you call them?"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Your Relationship *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {relationships.map((rel) => (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => updateFormData("relationship", rel)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
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
                        Dates & Location
                      </h2>
                      <p className="text-sm text-gray-body">
                        When and where they lived
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark mb-2">
                          Date of Birth *
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

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        value={formData.birthPlace}
                        onChange={(e) =>
                          updateFormData("birthPlace", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        placeholder="City, State/Country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Final Resting Place
                      </label>
                      <input
                        type="text"
                        value={formData.restingPlace}
                        onChange={(e) =>
                          updateFormData("restingPlace", e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        placeholder="Cemetery name, City"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Add Photos
                      </h2>
                      <p className="text-sm text-gray-body">
                        Upload a profile photo and memories
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          {formData.profilePhotoPreview ? (
                            <div className="relative">
                              <img
                                src={formData.profilePhotoPreview}
                                alt="Profile preview"
                                className="w-24 h-24 rounded-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  updateFormData("profilePhoto", null);
                                  updateFormData("profilePhotoPreview", "");
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-sage-pale flex items-center justify-center">
                              <User className="w-10 h-10 text-sage" />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePhotoChange}
                              className="hidden"
                            />
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sage text-sage hover:bg-sage-pale transition-colors">
                              <Upload className="w-4 h-4" />
                              Upload Photo
                            </span>
                          </label>
                          <p className="text-xs text-gray-body mt-2">
                            JPG, PNG up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Photos Placeholder */}
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Additional Photos
                      </label>
                      <div className="border-2 border-dashed border-sage-pale rounded-xl p-8 text-center hover:border-sage transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-sage mx-auto mb-3" />
                        <p className="text-gray-body mb-2">
                          Drag and drop photos here, or click to browse
                        </p>
                        <p className="text-xs text-gray-light">
                          You can add more photos after creating the memorial
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 4: Their Story */}
              {currentStep === 4 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <FileText className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Their Story
                      </h2>
                      <p className="text-sm text-gray-body">
                        Write an obituary or life story
                      </p>
                    </div>
                  </div>

                  <ObituaryWriter
                    deceasedName={`${formData.firstName} ${formData.lastName}`}
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

              {/* Step 5: Invite Family */}
              {currentStep === 5 && (
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
                      <Users className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-dark">
                        Invite Family Members
                      </h2>
                      <p className="text-sm text-gray-body">
                        Share this memorial with loved ones
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.inviteEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            updateInviteEmail(index, e.target.value)
                          }
                          className="flex-1 px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                          placeholder="Email address"
                        />
                        {formData.inviteEmails.length > 1 && (
                          <button
                            onClick={() => removeInviteEmail(index)}
                            className="p-3 text-gray-body hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={addInviteEmail}
                      className="text-sage hover:text-sage-dark text-sm font-medium"
                    >
                      + Add another email
                    </button>

                    <div className="pt-4 border-t border-sage-pale/50">
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
                  </div>
                </Card>
              )}

              {/* Step 6: Review */}
              {currentStep === 6 && (
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
                      {formData.profilePhotoPreview ? (
                        <img
                          src={formData.profilePhotoPreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-sage-pale flex items-center justify-center mx-auto mb-4">
                          <Flower2 className="w-10 h-10 text-sage" />
                        </div>
                      )}
                      <h3 className="text-2xl font-serif font-bold text-gray-dark">
                        {formData.firstName}{" "}
                        {formData.middleName && `${formData.middleName} `}
                        {formData.lastName}
                      </h3>
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
                        <span className="text-gray-body">Relationship</span>
                        <span className="font-medium text-gray-dark">
                          {formData.relationship}
                        </span>
                      </div>
                      {formData.birthPlace && (
                        <div className="flex justify-between py-2 border-b border-sage-pale/50">
                          <span className="text-gray-body">Birth Place</span>
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
                      <div className="flex justify-between py-2 border-b border-sage-pale/50">
                        <span className="text-gray-body">Visibility</span>
                        <span className="font-medium text-gray-dark">
                          {formData.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-body">Family Invites</span>
                        <span className="font-medium text-gray-dark">
                          {formData.inviteEmails.filter((e) => e).length} people
                        </span>
                      </div>
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
