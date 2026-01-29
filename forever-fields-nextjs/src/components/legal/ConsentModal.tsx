"use client";

import { useState, useCallback } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ConsentType,
  CONSENT_TEXTS,
  CONSENT_VERSIONS,
  AuthorizationType,
} from "@/lib/audit/types";
import { cn } from "@/lib/utils";

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (data: ConsentData) => Promise<void>;
  consentType: ConsentType;
  memorialId?: string;
  personName?: string; // Name of deceased for family authorization
  showFamilyAuthOptions?: boolean;
}

export interface ConsentData {
  consentType: ConsentType;
  memorialId?: string;
  authorizationType?: AuthorizationType;
  relationshipToDeceased?: string;
  proofDocumentUrl?: string;
  agreedToTerms: boolean;
}

const CONSENT_TITLES: Record<ConsentType, string> = {
  VOICE_SELF: "Voice Recording Consent",
  VOICE_FAMILY: "Voice Authorization",
  AI_COMPANION: "AI Companion Consent",
  EVENT_RECORDING: "Event Recording Consent",
  LOCATION_TRACKING: "Location Tracking Consent",
  DATA_PROCESSING: "Data Processing Consent",
};

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandchild", label: "Grandchild" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other_family", label: "Other Family Member" },
  { value: "legal_representative", label: "Legal Representative" },
];

const AUTHORIZATION_TYPE_OPTIONS: Array<{
  value: AuthorizationType;
  label: string;
  description: string;
}> = [
  {
    value: "legal_executor",
    label: "Legal Executor",
    description: "Named executor of the estate",
  },
  {
    value: "next_of_kin",
    label: "Next of Kin",
    description: "Immediate family member",
  },
  {
    value: "power_of_attorney",
    label: "Power of Attorney",
    description: "Held power of attorney before passing",
  },
  {
    value: "written_permission",
    label: "Written Permission",
    description: "Have written permission from authorized family",
  },
  {
    value: "pre_mortem_consent",
    label: "Pre-Mortem Consent",
    description: "Deceased gave consent before passing",
  },
];

export function ConsentModal({
  isOpen,
  onClose,
  onConsent,
  consentType,
  memorialId,
  personName,
  showFamilyAuthOptions = false,
}: ConsentModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [authorizationType, setAuthorizationType] =
    useState<AuthorizationType | null>(null);
  const [relationship, setRelationship] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [acknowledgedAI, setAcknowledgedAI] = useState(false);
  const [acknowledgedRevocable, setAcknowledgedRevocable] = useState(false);
  const [acknowledgedResponsibility, setAcknowledgedResponsibility] =
    useState(false);

  const title = CONSENT_TITLES[consentType];
  const consentText = CONSENT_TEXTS[consentType];
  const isFamilyAuth =
    consentType === "VOICE_FAMILY" || showFamilyAuthOptions;

  const totalSteps = isFamilyAuth ? 3 : 2;

  const resetForm = useCallback(() => {
    setStep(1);
    setAuthorizationType(null);
    setRelationship("");
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

  const canProceed = () => {
    if (step === 1 && isFamilyAuth) {
      return authorizationType !== null;
    }
    if (step === 2 && isFamilyAuth) {
      return relationship !== "";
    }
    // Final step
    if (isFamilyAuth) {
      return (
        agreedToTerms &&
        acknowledgedAI &&
        acknowledgedRevocable &&
        acknowledgedResponsibility
      );
    }
    return agreedToTerms && acknowledgedAI;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConsent({
        consentType,
        memorialId,
        authorizationType: authorizationType || undefined,
        relationshipToDeceased: relationship || undefined,
        agreedToTerms: true,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record consent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    } else if (canProceed() && step === totalSteps) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      showCloseButton={!isSubmitting}
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i + 1 === step
                  ? "w-8 bg-sage"
                  : i + 1 < step
                    ? "w-2 bg-sage/50"
                    : "w-2 bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* Step 1 for family auth: Authorization type */}
        {isFamilyAuth && step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-dark">
                Authorization Type
              </h3>
              <p className="text-sm text-gray-body mt-1">
                How are you authorized to manage voice settings for{" "}
                {personName || "this person"}?
              </p>
            </div>

            <div className="space-y-3">
              {AUTHORIZATION_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all",
                    authorizationType === option.value
                      ? "border-sage bg-sage-pale"
                      : "border-gray-200 hover:border-sage/50"
                  )}
                >
                  <input
                    type="radio"
                    name="authorizationType"
                    value={option.value}
                    checked={authorizationType === option.value}
                    onChange={() => setAuthorizationType(option.value)}
                    className="mt-1 mr-3 text-sage focus:ring-sage"
                  />
                  <div>
                    <span className="font-medium text-gray-dark">
                      {option.label}
                    </span>
                    <p className="text-sm text-gray-body">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 for family auth: Relationship */}
        {isFamilyAuth && step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-dark">
                Your Relationship
              </h3>
              <p className="text-sm text-gray-body mt-1">
                What is your relationship to {personName || "the deceased"}?
              </p>
            </div>

            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-sage focus:ring-sage"
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> You may be asked to provide documentation
                to verify your authorization. This helps protect the dignity of
                the deceased and ensures only authorized family members can
                manage voice features.
              </p>
            </div>
          </div>
        )}

        {/* Final step: Consent text and acknowledgments */}
        {((!isFamilyAuth && step === 1) || (isFamilyAuth && step === 3)) && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-dark">
                Please Review and Agree
              </h3>
            </div>

            {/* Consent text box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-dark whitespace-pre-line">
                {consentText}
              </p>
            </div>

            {/* Version info */}
            <p className="text-xs text-gray-body text-center">
              Consent Version: {CONSENT_VERSIONS[consentType]}
            </p>

            {/* Acknowledgment checkboxes */}
            <div className="space-y-3 pt-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm text-gray-dark">
                  I have read and agree to the terms above
                </span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedAI}
                  onChange={(e) => setAcknowledgedAI(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm text-gray-dark">
                  I understand this involves AI-generated content that may not
                  be perfect
                </span>
              </label>

              {isFamilyAuth && (
                <>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgedRevocable}
                      onChange={(e) =>
                        setAcknowledgedRevocable(e.target.checked)
                      }
                      className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
                    />
                    <span className="text-sm text-gray-dark">
                      I understand I can revoke this consent at any time
                    </span>
                  </label>

                  <label className="flex items-start cursor-pointer">
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
                      content
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

        {/* Non-family consent (simple) */}
        {!isFamilyAuth && step === 2 && (
          <div className="space-y-4">
            {/* This step shouldn't be reached for non-family auth */}
          </div>
        )}

        <ModalFooter>
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
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
            {step === totalSteps ? "I Agree" : "Continue"}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/**
 * Simplified consent modal for quick consents (AI Companion, etc.)
 */
export function QuickConsentModal({
  isOpen,
  onClose,
  onConsent,
  consentType,
  memorialId,
}: Omit<ConsentModalProps, "showFamilyAuthOptions" | "personName">) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = CONSENT_TITLES[consentType];
  const consentText = CONSENT_TEXTS[consentType];

  const handleSubmit = async () => {
    if (!agreed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConsent({
        consentType,
        memorialId,
        agreedToTerms: true,
      });
      setAgreed(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record consent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAgreed(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      showCloseButton={!isSubmitting}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-dark whitespace-pre-line">
            {consentText}
          </p>
        </div>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 mr-3 h-4 w-4 text-sage focus:ring-sage rounded"
          />
          <span className="text-sm text-gray-dark">
            I have read and agree to the terms above
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            isLoading={isSubmitting}
          >
            I Agree
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
