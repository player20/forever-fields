"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge } from "@/components/ui";
import { CandleLighting, Guestbook } from "@/components/memorial";
import { LegacyCompanion } from "@/components/ai";
import type { CemeteryPlot } from "./VirtualCemeteryCanvas";
import {
  X,
  Flower2,
  MessageCircle,
  Sparkles,
  Share2,
  Heart,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PlotDetailsSidebarProps {
  plot: CemeteryPlot | null;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

type TabType = "overview" | "candle" | "guestbook" | "companion";

export function PlotDetailsSidebar({
  plot,
  onClose,
  userId = "anonymous",
  userName = "A visitor",
}: PlotDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isExpanded, setIsExpanded] = useState(true);

  if (!plot) return null;

  const memorial = plot.memorial;
  const isOccupied = !!memorial;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Flower2 className="w-4 h-4" /> },
    ...(isOccupied
      ? [
          { id: "candle" as TabType, label: "Candle", icon: <Heart className="w-4 h-4" /> },
          { id: "guestbook" as TabType, label: "Guestbook", icon: <MessageCircle className="w-4 h-4" /> },
          { id: "companion" as TabType, label: "AI Companion", icon: <Sparkles className="w-4 h-4" /> },
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sage to-sage-dark p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isOccupied ? (
                <>
                  <Badge variant="secondary" className="mb-2 bg-white/20 text-white">
                    Memorial
                  </Badge>
                  <h2 className="text-2xl font-serif font-bold">
                    {memorial.name}
                  </h2>
                  {memorial.birthYear && memorial.deathYear && (
                    <p className="text-white/80 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {memorial.birthYear} - {memorial.deathYear}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="mb-2 bg-white/20 text-white">
                    Available Plot
                  </Badge>
                  <h2 className="text-2xl font-serif font-bold">
                    Reserve This Plot
                  </h2>
                  <p className="text-white/80 mt-1">
                    Create a lasting memorial in this peaceful location
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Location badge */}
          <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {plot.districtId
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </span>
            <span className="text-white/50">·</span>
            <span>Plot #{plot.id.split("-").slice(-2).join("-")}</span>
          </div>
        </div>

        {/* Tabs */}
        {isOccupied && (
          <div className="flex border-b border-gray-200 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-sage text-sage"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {isOccupied ? (
                <>
                  {/* Memorial profile */}
                  <div className="text-center">
                    {memorial.profilePhoto ? (
                      <img
                        src={memorial.profilePhoto}
                        alt={memorial.name}
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4 ring-4 ring-sage-pale"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-sage-pale mx-auto mb-4 flex items-center justify-center ring-4 ring-sage-pale/50">
                        <Flower2 className="w-16 h-16 text-sage" />
                      </div>
                    )}
                    {memorial.hasCandle && (
                      <Badge className="bg-amber-100 text-amber-700 mb-2">
                        Candle lit
                      </Badge>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("candle")}
                      className="flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      Light Candle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("guestbook")}
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Guestbook
                    </Button>
                  </div>

                  {/* AI Companion promo */}
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-dark">
                            Talk with {memorial.name.split(" ")[0]}
                          </h4>
                          <p className="text-sm text-gray-body mt-1">
                            Our AI Legacy Companion lets you have a conversation
                            that honors their memory and personality.
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 bg-purple-600 hover:bg-purple-700"
                            onClick={() => setActiveTab("companion")}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Conversation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* View full memorial link */}
                  <Button className="w-full" variant="secondary">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Memorial
                  </Button>
                </>
              ) : (
                <>
                  {/* Available plot info */}
                  <div className="text-center py-8">
                    <div className="w-24 h-24 rounded-full bg-sage-pale mx-auto mb-4 flex items-center justify-center">
                      <span className="text-4xl">🌿</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-dark mb-2">
                      This plot is available
                    </h3>
                    <p className="text-gray-body mb-6">
                      Create a beautiful memorial in this peaceful location within
                      the{" "}
                      {plot.districtId
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}{" "}
                      district.
                    </p>
                    <Button className="w-full mb-3">Create Memorial Here</Button>
                    <Button variant="outline" className="w-full">
                      Reserve for Later
                    </Button>
                  </div>

                  {/* District features */}
                  <Card className="p-4">
                    <h4 className="font-medium text-gray-dark mb-3">
                      District Features
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-body">
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center">
                          ✓
                        </div>
                        Peaceful garden setting
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center">
                          ✓
                        </div>
                        24/7 virtual visits
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center">
                          ✓
                        </div>
                        AI Legacy Companion
                      </li>
                    </ul>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Candle Tab */}
          {activeTab === "candle" && memorial && (
            <CandleLighting
              memorialId={memorial.id}
              memorialName={memorial.name}
              userId={userId}
              userName={userName}
              demoMode
            />
          )}

          {/* Guestbook Tab */}
          {activeTab === "guestbook" && memorial && (
            <Guestbook
              memorialId={memorial.id}
              memorialName={memorial.name}
              userId={userId}
              userName={userName}
              demoMode
            />
          )}

          {/* AI Companion Tab */}
          {activeTab === "companion" && memorial && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>Note:</strong> This AI companion is designed to provide
                  comfort by simulating conversations based on memorial
                  information. It is not a replacement for professional grief
                  support.
                </p>
              </div>
              <LegacyCompanion
                profile={{
                  name: memorial.name,
                  birthYear: memorial.birthYear?.toString(),
                  deathYear: memorial.deathYear?.toString(),
                }}
                userRelationship="visitor"
                demoMode
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {isOccupied && (
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
    </AnimatePresence>
  );
}
