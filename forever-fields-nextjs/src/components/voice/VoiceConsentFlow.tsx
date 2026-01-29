"use client";

import { useState, useCallback } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  VoiceAuthorizationType,
  FamilyRelationship,
  ProofDocumentType,
  FamilyAuthorizationData,
  getRelationshipLabel,
  getDocumentTypeLabel,
} from "@/lib/voice/types";
import { cn } from "@/lib/utils";

export interface VoiceConsentFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: FamilyAuthorizationData) => Promise<void>;
  memorialId: string;
  personName: string;
}

type Step =
  | "intro"
  | "auth_type"
  | "relationship"
  | "document"
  | "acknowledgments"
  | "complete";

const AUTH_TYPE_OPTIONS: Array<{
  value: VoiceAuthorizationType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "self_recorded",
    label: "Recording My Own Voice",
    description: "I am pre-planning and want to record my own voice for future use",
    icon: "🎙️",
  },
  {
    value: "family_authorized",
    label: "Family Authorization",
    description: "I have legal authority to authorize voice use for my loved one",
    icon: "👨‍👩‍👧",
  },
  {
    value: "pre_mortem_consent",
    label: "Pre-Existing Consent",
    description: "My loved one gave consent before passing",
    icon: "📝",
  },
];

const RELATIONSHIP_OPTIONS: FamilyRelationship[] = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandchild",
  "grandparent",
  "legal_guardian",
  "executor",
  "power_of_attorney",
  "other",
];

const DOCUMENT_TYPE_OPTIONS: Array<{
  value: ProofDocumentType;
  description: string;
}> = [
  {
    value: "death_certificate",
    description: "Shows you as next of kin or executor",
  },
  {
    value: "will",
    description: "Names you as executor or grants voice rights",
  },
  {
    value: "power_of_attorney",
    description: "Legal authority document",
  },
  {
    value: "written_permission",
    description: "Written consent from the deceased",
  },
  {
    value: "funeral_home_letter",
    description: "Letter from funeral home (temporary acceptance)",
  },
  {
    value: "other",
    description: "Other legal documentation",
  },
];

export function VoiceConsentFlow({
  isOpen,
  onClose,
  onComplete,
  personName,
}: VoiceConsentFlowProps) {
  const [step, setStep] = useState<Step>("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [authType, setAuthType] = useState<VoiceAuthorizationType | null>(null);
  const [relationship, setRelationship] = useState<FamilyRelationship | null>(null);
  const [documentType, setDocumentType] = useState<ProofDocumentType | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [acknowledgedAI, setAcknowledgedAI] = useState(false);
  const [acknowledgedRevocable, setAcknowledgedRevocable] = useState(false);
  const [acknowledgedResponsibility, setAcknowledgedResponsibility] = useState(false);

  const resetForm = useCallback(() => {
    setStep("intro");
    setAuthType(null);
    setRelationship(null);
    setDocumentType(null);
    setDocumentUrl("");
    setAgreedToTerms(false);
    setAcknowledgedAI(false);
    setAcknowledgedRevocable(false);
    setAcknowledgedResponsibility(false);
    setError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "intro":
        return true;
      case "auth_type":
        return authType !== null;
      case "relationship":
        return relationship !== null;
      case "document":
        return documentType !== null;
      case "acknowledgments":
        if (authType === "self_recorded") {
          return agreedToTerms && acknowledgedAI;
        }
        return (
          agreedToTerms &&
          acknowledgedAI &&
          acknowledgedRevocable &&
          acknowledgedResponsibility
        );
      default:
        return false;
    }
  };

  const getNextStep = (): Step => {
    switch (step) {
      case "intro":
        return "auth_type";
      case "auth_type":
        // Self-recorded skips relationship and document
        if (authType === "self_recorded") {
          return "acknowledgments";
        }
        return "relationship";
      case "relationship":
        return "document";
      case "document":
        return "acknowledgments";
      case "acknowledgments":
        return "complete";
      default:
        return "intro";
    }
  };

  const getPrevStep = (): Step => {
    switch (step) {
      case "auth_type":
        return "intro";
      case "relationship":
        return "auth_type";
      case "document":
        return "relationship";
      case "acknowledgments":
        if (authType === "self_recorded") {
          return "auth_type";
        }
        return "document";
      default:
        return "intro";
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    if (step === "acknowledgments") {
      // Submit the consent
      setIsSubmitting(true);
      setError(null);

      try {
        await onComplete({
          authorizationType: authType!,
          relationship: relationship || "other",
          proofDocumentType: documentType || "other",
          proofDocumentUrl: documentUrl || undefined,
          agreedToTerms,
          acknowledgedAI,
          acknowledgedRevocable,
          acknowledgedResponsibility,
        });
        setStep("complete");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit consent");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(getNextStep());
    }
  };

  const handleBack = () => {
    setStep(getPrevStep());
  };

  const getStepNumber = (): number => {
    const steps: Step[] =
      authType === "self_recorded"
        ? ["intro", "auth_type", "acknowledgments", "complete"]
        : ["intro", "auth_type", "relationship", "document", "acknowledgments", "complete"];
    return steps.indexOf(step);
  };

  const getTotalSteps = (): number => {
    return authType === "self_recorded" ? 4 : 6;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Voice Authorization"
      size="lg"
      showCloseButton={step !== "complete" && !isSubmitting}
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: getTotalSteps() }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === getStepNumber()
                    ? "w-8 bg-sage"
                    : i < getStepNumber()
                      ? "w-2 bg-sage/50"
                      : "w-2 bg-gray-200"
                )}
              />
            ))}
          </div>
        )}

        {/* Intro Step */}
        {step === "intro" && (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🎙️</div>
            <h3 className="text-xl font-medium text-gray-dark mb-4">
              Voice Message Feature
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create AI-generated voice messages that sound like {personName}.
              This is a sensitive feature that requires proper authorization.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> This feature uses AI to generate voice
                messages. The generated voice will not be a perfect replica and is
                clearly marked as AI-generated.
              </p>
            </div>
          </div>
        )}

        {/* Authorization Type Step */}
        {step === "auth_type" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-dark">
                How are you authorized?
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select the option that best describes your situation
              </p>
            </div>

            <div className="space-y-3">
              {AUTH_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all",
                    authType === option.value
                      ? "border-sage bg-sage-pale"
                      : "border-gray-200 hover:border-sage/50"
                  )}
                >
                  <input
                    type="radio"
                    name="authType"
                    value={option.value}
                    checked={authType === option.value}
                    onChange={() => setAuthType(option.value)}
                    className="mt-1 mr-3 text-sage focus:ring-sage"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium text-gray-dark">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Step */}
        {step === "relationship" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-dark">
                Your Relationship
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                What is your relationship to {personName}?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <button
                  key={rel}
                  onClick={() => setRelationship(rel)}
                  className={cn(
                    "p-3 text-left border-2 rounded-lg transition-all",
                    relationship === rel
                      ? "border-sage bg-sage-pale"
                      : "border-gray-200 hover:border-sage/50"
                  )}
                >
                  {getRelationshipLabel(rel)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Step */}
        {step === "document" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-dark">
                Authorization Document
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                What type of documentation can you provide?
              </p>
            </div>

            <div className="space-y-2">
              {DOCUMENT_TYPE_OPTIONS.map((doc) => (
                <label
                  key={doc.value}
                  className={cn(
                    "flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all",
                    documentType === doc.value
                      ? "border-sage bg-sage-pale"
                      : "border-gray-200 hover:border-sage/50"
                  )}
                >
                  <input
                    type="radio"
                    name="documentType"
                    value={doc.value}
                    checked={documentType === doc.value}
                    onChange={() => setDocumentType(doc.value)}
                    className="mt-1 mr-3 text-sage focus:ring-sage"
                  />
                  <div>
                    <span className="font-medium text-gray-dark">
                      {getDocumentTypeLabel(doc.value)}
                    </span>
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You&apos;ll be asked to upload your
                documentation after this flow. Your authorization will be
                reviewed within 24-48 hours.
              </p>
            </div>
          </div>
        )}

        {/* Acknowledgments Step */}
        {step === "acknowledgments" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-dark">
                Please Acknowledge
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-start cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm text-gray-dark">
                  I confirm I have legal authority to authorize voice reproduction
                  for {personName}
                </span>
              </label>

              <label className="flex items-start cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={acknowledgedAI}
                  onChange={(e) => setAcknowledgedAI(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm text-gray-dark">
                  I understand the voice will be AI-generated and may not
                  perfectly replicate the actual voice
                </span>
              </label>

              {authType !== "self_recorded" && (
                <>
                  <label className="flex items-start cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={acknowledgedRevocable}
                      onChange={(e) => setAcknowledgedRevocable(e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                    />
                    <span className="text-sm text-gray-dark">
                      I understand I can revoke this authorization at any time
                    </span>
                  </label>

                  <label className="flex items-start cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={acknowledgedResponsibility}
                      onChange={(e) =>
                        setAcknowledgedResponsibility(e.target.checked)
                      }
                      className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                    />
                    <span className="text-sm text-gray-dark">
                      I accept responsibility for appropriate use of generated
                      audio within my family
                    </span>
                  </label>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-xl font-medium text-gray-dark mb-2">
              Authorization Submitted
            </h3>
            {authType === "self_recorded" ? (
              <p className="text-gray-600 mb-6">
                You can now upload voice samples to create your voice profile.
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                Your authorization is pending review. We&apos;ll notify you once
                it&apos;s approved (usually within 24-48 hours).
              </p>
            )}
            <Button onClick={handleClose}>Continue</Button>
          </div>
        )}

        {/* Footer */}
        {step !== "complete" && (
          <ModalFooter>
            {step !== "intro" && (
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              isLoading={isSubmitting}
            >
              {step === "acknowledgments" ? "Submit" : "Continue"}
            </Button>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
}
