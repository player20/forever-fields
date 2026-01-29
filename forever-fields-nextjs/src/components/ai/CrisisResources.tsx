"use client";

import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CrisisResource, CrisisTier } from "@/lib/ai/crisis-detection";

export interface CrisisResourcesProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  resources: CrisisResource[];
  tier: CrisisTier;
  countryCode?: string;
}

/**
 * Crisis resources modal
 *
 * Shows immediate help resources when crisis indicators are detected.
 * Tier 1 (immediate crisis) shows more urgent messaging.
 * Tier 2 (high concern) shows gentler resource offering.
 */
export function CrisisResourcesModal({
  isOpen,
  onClose,
  onAcknowledge,
  resources,
  tier,
}: CrisisResourcesProps) {
  const primaryResource = resources.find((r) => r.isPrimary) || resources[0];
  const otherResources = resources.filter((r) => r !== primaryResource);

  const isImmediateCrisis = tier === 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isImmediateCrisis ? () => {} : onClose}
      title={isImmediateCrisis ? "We're Here for You" : "Support Resources"}
      size="md"
      showCloseButton={!isImmediateCrisis}
    >
      <div className="space-y-4">
        {/* Main message */}
        <div
          className={`p-4 rounded-lg ${isImmediateCrisis ? "bg-rose-50 border border-rose-200" : "bg-blue-50 border border-blue-200"}`}
        >
          <p
            className={`text-sm ${isImmediateCrisis ? "text-rose-800" : "text-blue-800"}`}
          >
            {isImmediateCrisis ? (
              <>
                It sounds like you&apos;re going through an incredibly difficult
                time. <strong>You&apos;re not alone</strong>, and there are people
                who want to help right now.
              </>
            ) : (
              <>
                Grief can feel overwhelming sometimes. If you&apos;re struggling,
                there are people who understand and want to help.
              </>
            )}
          </p>
        </div>

        {/* Primary resource */}
        {primaryResource && (
          <div className="bg-white border-2 border-sage rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <h4 className="font-medium text-sage-dark">
                  {primaryResource.name}
                </h4>
                <p className="text-lg font-bold text-sage mt-1">
                  {primaryResource.action}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Available: {primaryResource.available}
                </p>
                {primaryResource.url && (
                  <a
                    href={primaryResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sage hover:underline mt-1 block"
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other resources */}
        {otherResources.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">
              Additional Resources:
            </h5>
            {otherResources.map((resource, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm text-gray-dark">
                    {resource.name}
                  </p>
                  <p className="text-sm text-gray-500">{resource.action}</p>
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage hover:underline text-sm"
                  >
                    Visit
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Acknowledgment text */}
        <p className="text-xs text-gray-500 text-center">
          {isImmediateCrisis
            ? "Please reach out to one of these resources - they're available 24/7 and want to help."
            : "These resources are here whenever you need them."}
        </p>

        <ModalFooter>
          {!isImmediateCrisis && (
            <Button variant="ghost" onClick={onClose}>
              Not now
            </Button>
          )}
          <Button variant="primary" onClick={onAcknowledge}>
            {isImmediateCrisis
              ? "I understand, continue"
              : "Thanks, I'll keep these in mind"}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/**
 * Inline crisis banner (less intrusive than modal)
 */
export function CrisisResourcesBanner({
  resources,
  onDismiss,
}: {
  resources: CrisisResource[];
  onDismiss: () => void;
}) {
  const primaryResource = resources.find((r) => r.isPrimary) || resources[0];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">💙</span>
        <div className="flex-1">
          <p className="text-sm text-blue-800">
            If you&apos;re struggling, support is available.{" "}
            {primaryResource && (
              <strong>{primaryResource.action}</strong>
            )}{" "}
            ({primaryResource?.available})
          </p>
          <div className="flex items-center gap-4 mt-2">
            {primaryResource?.url && (
              <a
                href={primaryResource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-700 hover:underline"
              >
                More resources
              </a>
            )}
            <button
              onClick={onDismiss}
              className="text-xs text-blue-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
