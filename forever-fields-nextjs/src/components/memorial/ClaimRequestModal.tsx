"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import {
  X,
  UserPlus,
  Heart,
  Shield,
  Send,
} from "lucide-react";

interface ClaimRequestModalProps {
  memorialName: string;
  memorialId: string;
  onSubmit: (data: ClaimRequestData) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export interface ClaimRequestData {
  memorialId: string;
  relationship: string;
  message: string;
  proofDescription: string;
}

const relationships = [
  "Spouse/Partner",
  "Child",
  "Parent",
  "Sibling",
  "Grandchild",
  "Grandparent",
  "Aunt/Uncle",
  "Niece/Nephew",
  "Cousin",
  "Close Friend",
  "Other Family",
];

export function ClaimRequestModal({
  memorialName,
  memorialId,
  onSubmit,
  onClose,
  isSubmitting = false,
}: ClaimRequestModalProps) {
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [proofDescription, setProofDescription] = useState("");

  const canSubmit = relationship && message.length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit({
      memorialId,
      relationship,
      message,
      proofDescription,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-sage-pale/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-pale flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-sage" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold text-gray-dark">
                  Request Access
                </h2>
                <p className="text-sm text-gray-body">
                  For {memorialName}&apos;s memorial
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-sage-pale/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Explanation */}
          <div className="p-4 bg-sage-pale/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-body">
                <p className="font-medium text-gray-dark mb-1">
                  Why we verify requests
                </p>
                <p>
                  To protect the privacy and dignity of those being remembered,
                  we ask that you verify your connection. The current memorial
                  owner will review your request.
                </p>
              </div>
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              Your relationship to {memorialName.split(" ")[0]} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {relationships.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setRelationship(rel)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    relationship === rel
                      ? "border-sage bg-sage-pale text-sage-dark"
                      : "border-sage-pale hover:border-sage hover:bg-sage-pale/50"
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              Tell us about your connection *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Share a memory or detail that shows your relationship (min. 20
              characters)
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
              placeholder="For example: I'm their daughter and I'd like to add photos from our family albums..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {message.length}/20 minimum
            </p>
          </div>

          {/* Proof Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-dark mb-2">
              How can you verify this? (Optional)
            </label>
            <textarea
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-sage-pale focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
              placeholder="e.g., I have family photos, legal documents, etc."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <Heart className="w-4 h-4" />
                  </span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
