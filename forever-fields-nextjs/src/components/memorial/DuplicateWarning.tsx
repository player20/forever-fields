"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import {
  AlertTriangle,
  Users,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserPlus,
  Plus,
  X,
} from "lucide-react";
import {
  DuplicateMatch,
  getConfidenceLabel,
} from "@/lib/duplicates/detection";

interface DuplicateWarningProps {
  matches: DuplicateMatch[];
  onClaimExisting: (memorialId: string) => void;
  onCreateAnyway: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DuplicateWarning({
  matches,
  onClaimExisting,
  onCreateAnyway,
  onCancel,
  isLoading = false,
}: DuplicateWarningProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    matches[0]?.memorial.id || null
  );
  const [selectedAction, setSelectedAction] = useState<
    "claim" | "create" | null
  >(null);

  if (matches.length === 0) return null;

  const topMatch = matches[0];
  const topConfidence = getConfidenceLabel(topMatch.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Warning Header */}
      <div
        className={`p-4 rounded-lg border-2 ${
          topConfidence.color === "red"
            ? "bg-red-50 border-red-200"
            : topConfidence.color === "yellow"
            ? "bg-amber-50 border-amber-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`w-6 h-6 flex-shrink-0 ${
              topConfidence.color === "red"
                ? "text-red-500"
                : topConfidence.color === "yellow"
                ? "text-amber-500"
                : "text-green-500"
            }`}
          />
          <div>
            <h3 className="font-semibold text-gray-dark">
              We found {matches.length === 1 ? "a" : matches.length} potential{" "}
              {matches.length === 1 ? "match" : "matches"}
            </h3>
            <p className="text-sm text-gray-body mt-1">
              {topConfidence.description}. Please review{" "}
              {matches.length === 1 ? "this memorial" : "these memorials"} to
              avoid creating a duplicate.
            </p>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {matches.slice(0, 5).map((match) => {
          const confidence = getConfidenceLabel(match.confidence);
          const isExpanded = expandedId === match.memorial.id;

          return (
            <Card
              key={match.memorial.id}
              className={`overflow-hidden transition-all ${
                isExpanded ? "ring-2 ring-sage" : ""
              }`}
            >
              {/* Match Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : match.memorial.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-sage-pale/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Profile Photo or Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center overflow-hidden">
                    {match.memorial.profilePhotoUrl ? (
                      <img
                        src={match.memorial.profilePhotoUrl}
                        alt={match.memorial.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-sage" />
                    )}
                  </div>

                  {/* Name and Info */}
                  <div className="text-left">
                    <p className="font-semibold text-gray-dark">
                      {match.memorial.firstName}{" "}
                      {match.memorial.middleName &&
                        `${match.memorial.middleName} `}
                      {match.memorial.lastName}
                    </p>
                    {match.memorial.birthDate && match.memorial.deathDate && (
                      <p className="text-sm text-gray-body">
                        {new Date(match.memorial.birthDate).getFullYear()} -{" "}
                        {new Date(match.memorial.deathDate).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Confidence Badge */}
                  <Badge
                    variant={
                      confidence.color === "red"
                        ? "error"
                        : confidence.color === "yellow"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {Math.round(match.confidence * 100)}% match
                  </Badge>

                  {/* Expand/Collapse Icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-sage-pale/50 pt-4 space-y-4">
                      {/* Match Reasons */}
                      <div>
                        <p className="text-sm font-medium text-gray-dark mb-2">
                          Why this might be a match:
                        </p>
                        <ul className="text-sm text-gray-body space-y-1">
                          {match.matchReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {match.memorial.birthPlace && (
                          <div className="flex items-center gap-2 text-gray-body">
                            <MapPin className="w-4 h-4 text-sage" />
                            <span>Born: {match.memorial.birthPlace}</span>
                          </div>
                        )}
                        {match.memorial.restingPlace && (
                          <div className="flex items-center gap-2 text-gray-body">
                            <MapPin className="w-4 h-4 text-sage" />
                            <span>Resting: {match.memorial.restingPlace}</span>
                          </div>
                        )}
                        {match.memorial.birthDate && (
                          <div className="flex items-center gap-2 text-gray-body">
                            <Calendar className="w-4 h-4 text-sage" />
                            <span>
                              Birth:{" "}
                              {new Date(
                                match.memorial.birthDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {match.memorial.deathDate && (
                          <div className="flex items-center gap-2 text-gray-body">
                            <Calendar className="w-4 h-4 text-sage" />
                            <span>
                              Death:{" "}
                              {new Date(
                                match.memorial.deathDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Count */}
                      {match.memorial.viewCount !== undefined &&
                        match.memorial.viewCount > 0 && (
                          <p className="text-xs text-gray-400">
                            This memorial has been viewed{" "}
                            {match.memorial.viewCount} times
                          </p>
                        )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        {match.memorial.slug && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/memorial/${match.memorial.slug}`,
                                "_blank"
                              )
                            }
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Memorial
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedAction("claim");
                            onClaimExisting(match.memorial.id);
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          This is them - Request Access
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Show more if there are many matches */}
      {matches.length > 5 && (
        <p className="text-sm text-center text-gray-body">
          + {matches.length - 5} more potential matches
        </p>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-sage-pale/50">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Go Back
        </Button>

        <div className="flex-1" />

        <Button
          variant="secondary"
          onClick={() => {
            setSelectedAction("create");
            onCreateAnyway();
          }}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {topConfidence.color === "red"
            ? "Create Anyway (Not a Match)"
            : "None of These - Create New"}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && selectedAction && (
        <div className="text-center text-sm text-gray-body animate-pulse">
          {selectedAction === "claim"
            ? "Submitting access request..."
            : "Creating memorial..."}
        </div>
      )}
    </motion.div>
  );
}
