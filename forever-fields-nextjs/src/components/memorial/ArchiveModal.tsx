"use client";

import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PERMANENCE_PRICING } from "@/lib/arweave/types";

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialId: string;
  memorialName: string;
  userTier?: string;
  onArchiveComplete?: (result: {
    transactionId: string;
    arweaveUrl: string;
  }) => void;
}

interface CostEstimate {
  bytes: number;
  storageCostUsd: number;
  totalCostUsd: number;
  includedInTier: boolean;
  userTier: string;
}

export function ArchiveModal({
  isOpen,
  onClose,
  memorialId,
  memorialName,
  userTier: _userTier = "free",
  onArchiveComplete,
}: ArchiveModalProps) {
  const [step, setStep] = useState<"info" | "confirm" | "processing" | "complete">(
    "info"
  );
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    transactionId: string;
    arweaveUrl: string;
  } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch cost estimate when modal opens
  useEffect(() => {
    if (isOpen && !estimate) {
      fetchEstimate();
    }
  }, [isOpen]);

  const fetchEstimate = async () => {
    try {
      const response = await fetch(
        `/api/permanence/archive?memorialId=${memorialId}&estimate=true`
      );
      const data = await response.json();

      if (data.estimate) {
        setEstimate(data.estimate);
      } else if (data.isArchived) {
        // Already archived
        setError("This memorial has already been archived.");
      }
    } catch {
      setError("Failed to fetch estimate");
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    setError(null);
    setStep("processing");

    try {
      const response = await fetch("/api/permanence/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialId,
          includeProfilePhoto: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          transactionId: data.archive.transactionId,
          arweaveUrl: data.archive.arweaveUrl,
        });
        setStep("complete");
        onArchiveComplete?.({
          transactionId: data.archive.transactionId,
          arweaveUrl: data.archive.arweaveUrl,
        });
      } else {
        setError(data.error || "Failed to archive memorial");
        setStep("confirm");
      }
    } catch {
      setError("An error occurred while archiving");
      setStep("confirm");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("info");
    setError(null);
    setAgreedToTerms(false);
    onClose();
  };

  const includedInTier = estimate?.includedInTier || false;
  const cost = includedInTier ? 0 : PERMANENCE_PRICING.oneTime;

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === "processing" ? () => {} : handleClose}
      title="Preserve Forever"
      size="md"
      showCloseButton={step !== "processing"}
    >
      <div className="space-y-4">
        {/* Info Step */}
        {step === "info" && (
          <>
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-dark mb-2">
                Permanent Blockchain Storage
              </h3>
              <p className="text-gray-600 text-sm">
                Store {memorialName}&apos;s memorial on the blockchain so it can
                never be deleted or lost, even if Forever Fields ceases to exist.
              </p>
            </div>

            <div className="bg-sage-pale rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sage-dark">What gets preserved:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Name, dates, and places
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Obituary text
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Profile photo (thumbnail)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Family tree structure
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Content verification hashes
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Large media (photos, videos) are not stored
                on-chain due to cost, but verification hashes are preserved.
              </p>
            </div>

            {estimate && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Archive size:</span>
                  <span className="font-medium">
                    {(estimate.bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Cost:</span>
                  {includedInTier ? (
                    <span className="text-green-600 font-medium">
                      Included in your plan
                    </span>
                  ) : (
                    <span className="font-medium">${cost.toFixed(2)} one-time</span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <ModalFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setStep("confirm")}>
                Continue
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Important Information
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>
                    • This action is <strong>permanent and irreversible</strong>
                  </li>
                  <li>
                    • The archived data cannot be modified or deleted
                  </li>
                  <li>
                    • Data will remain accessible for 200+ years
                  </li>
                  <li>
                    • Updates to the memorial will not affect the archive
                  </li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-sage focus:ring-sage rounded"
                />
                <span className="text-sm text-gray-700">
                  I understand that this archive is permanent and cannot be modified
                  or deleted. I confirm I have the right to archive this memorial.
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={() => setStep("info")}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleArchive}
                disabled={!agreedToTerms || isLoading}
                isLoading={isLoading}
              >
                {includedInTier
                  ? "Archive Forever"
                  : `Archive Forever - $${cost.toFixed(2)}`}
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-dark mb-2">
              Archiving to Blockchain...
            </h3>
            <p className="text-sm text-gray-500">
              This may take a few moments. Please don&apos;t close this window.
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && result && (
          <>
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-green-700 mb-2">
                Permanently Archived!
              </h3>
              <p className="text-sm text-gray-600">
                {memorialName}&apos;s memorial has been permanently stored on the
                Arweave blockchain.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transaction ID:</p>
                <p className="font-mono text-sm break-all">
                  {result.transactionId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">View on Arweave:</p>
                <a
                  href={result.arweaveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage hover:underline text-sm break-all"
                >
                  {result.arweaveUrl}
                </a>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                <strong>Save this information!</strong> The transaction ID can be
                used to verify and access this memorial even if Forever Fields is
                no longer available.
              </p>
            </div>

            <ModalFooter>
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </div>
    </Modal>
  );
}
