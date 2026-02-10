"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  Image as ImageIcon,
  MessageCircle,
  Sparkles,
  Camera,
  Paintbrush,
  Wand2,
  Play,
  Volume2,
  Bot,
  Crown,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui";

interface AIFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialName: string;
  onFeatureSelect?: (feature: string) => void;
  userTier?: "free" | "essentials" | "heritage" | "legacy";
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  tier: "free" | "essentials" | "heritage" | "legacy";
  color: string;
  gradient: string;
  action?: string;
}

const AI_FEATURES: AIFeature[] = [
  {
    id: "memory-assistant",
    name: "Memory Assistant",
    description: "Get help writing heartfelt obituaries and stories",
    icon: Wand2,
    tier: "free",
    color: "text-purple-600",
    gradient: "from-purple-500 to-indigo-600",
    action: "generate-obituary",
  },
  {
    id: "photo-restore",
    name: "Photo Restore",
    description: "Repair and enhance old or damaged photos",
    icon: Camera,
    tier: "essentials",
    color: "text-blue-600",
    gradient: "from-blue-500 to-cyan-600",
    action: "restore-photo",
  },
  {
    id: "photo-colorize",
    name: "Add Color",
    description: "Bring black & white photos to life with color",
    icon: Paintbrush,
    tier: "essentials",
    color: "text-pink-600",
    gradient: "from-pink-500 to-rose-600",
    action: "colorize-photo",
  },
  {
    id: "voice-remembrance",
    name: "Voice Remembrance",
    description: "Hear your loved one's voice again through AI",
    icon: Volume2,
    tier: "heritage",
    color: "text-amber-600",
    gradient: "from-amber-500 to-orange-600",
    action: "voice-clone",
  },
  {
    id: "living-portrait",
    name: "Living Portrait",
    description: "Animate photos with gentle, lifelike movement",
    icon: Play,
    tier: "heritage",
    color: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-600",
    action: "animate-photo",
  },
  {
    id: "ai-companion",
    name: "Memory Companion",
    description: "Chat with an AI that knows their stories and memories",
    icon: Bot,
    tier: "legacy",
    color: "text-violet-600",
    gradient: "from-violet-500 to-purple-600",
    action: "chat",
  },
];

const TIER_ORDER = ["free", "essentials", "heritage", "legacy"];

export function AIFeaturesModal({
  isOpen,
  onClose,
  memorialName,
  onFeatureSelect,
  userTier = "heritage",
}: AIFeaturesModalProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const userTierIndex = TIER_ORDER.indexOf(userTier);

  const isFeatureAvailable = (featureTier: string) => {
    return TIER_ORDER.indexOf(featureTier) <= userTierIndex;
  };

  const handleFeatureClick = (feature: AIFeature) => {
    if (isFeatureAvailable(feature.tier)) {
      setSelectedFeature(feature.id);
      if (onFeatureSelect && feature.action) {
        onFeatureSelect(feature.action);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold">
                  AI Features
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Enhance {memorialName}&apos;s memorial with AI
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_FEATURES.map((feature) => {
                const available = isFeatureAvailable(feature.tier);
                const Icon = feature.icon;

                return (
                  <motion.button
                    key={feature.id}
                    whileHover={available ? { scale: 1.02 } : {}}
                    whileTap={available ? { scale: 0.98 } : {}}
                    onClick={() => handleFeatureClick(feature)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      available
                        ? "border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer"
                        : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                    } ${
                      selectedFeature === feature.id
                        ? "border-purple-500 ring-2 ring-purple-200"
                        : ""
                    }`}
                  >
                    {/* Lock overlay for unavailable features */}
                    {!available && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <Lock className="w-3 h-3" />
                          <span className="capitalize">{feature.tier}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {feature.name}
                          {feature.tier === "legacy" && (
                            <Crown className="w-4 h-4 text-amber-500" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    {available && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className={`text-sm font-medium ${feature.color}`}>
                          Try it now →
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <Sparkles className="w-4 h-4 inline mr-1 text-purple-500" />
                Your plan: <span className="font-medium capitalize">{userTier}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIFeaturesModal;
