"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, Button, Badge } from "@/components/ui";
import { CandleLighting, Guestbook } from "@/components/memorial";
import { LegacyCompanion } from "@/components/ai";
import type { FamilyMember, Pet } from "./types";
import {
  X,
  Flower2,
  MessageCircle,
  Sparkles,
  Share2,
  Heart,
  Calendar,
  ExternalLink,
  PawPrint,
  Users,
  Camera,
  Dog,
  Cat,
  Bird,
} from "lucide-react";

interface MemorialSidebarProps {
  member?: FamilyMember | null;
  pet?: Pet | null;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

type TabType = "overview" | "candle" | "guestbook" | "companion";

function getSpeciesIcon(species: Pet["species"]) {
  switch (species) {
    case "dog":
      return Dog;
    case "cat":
      return Cat;
    case "bird":
      return Bird;
    default:
      return PawPrint;
  }
}

export function MemorialSidebar({
  member,
  pet,
  onClose,
  userId = "anonymous",
  userName = "A visitor",
}: MemorialSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!member && !pet) return null;

  const isPet = !!pet;
  const entity = pet || member!;
  const name = isPet ? pet!.name : `${member!.firstName} ${member!.lastName}`;
  const displayName = isPet
    ? pet!.name
    : member!.nickname || member!.firstName;
  const hasMemorial = entity.hasMemorial;
  const memorialId = entity.memorialId;
  const birthYear = isPet ? pet!.birthYear : member!.birthYear;
  const deathYear = isPet ? pet!.deathYear : member!.deathYear;
  const SpeciesIcon = isPet ? getSpeciesIcon(pet!.species) : null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: isPet ? <PawPrint className="w-4 h-4" /> : <Flower2 className="w-4 h-4" />,
    },
    ...(hasMemorial
      ? [
          {
            id: "candle" as TabType,
            label: "Candle",
            icon: <Heart className="w-4 h-4" />,
          },
          {
            id: "guestbook" as TabType,
            label: "Guestbook",
            icon: <MessageCircle className="w-4 h-4" />,
          },
          ...(!isPet
            ? [
                {
                  id: "companion" as TabType,
                  label: "AI Companion",
                  icon: <Sparkles className="w-4 h-4" />,
                },
              ]
            : []),
        ]
      : []),
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div
        key="sidebar"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div
          className={`p-6 text-white ${
            isPet
              ? "bg-gradient-to-r from-gold to-gold-dark"
              : "bg-gradient-to-r from-sage to-sage-dark"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge
                variant="secondary"
                className="mb-2 bg-white/20 text-white"
              >
                {isPet ? (
                  <span className="flex items-center gap-1">
                    {SpeciesIcon && <SpeciesIcon className="w-3 h-3" />}
                    Pet Memorial
                  </span>
                ) : hasMemorial ? (
                  "Memorial"
                ) : (
                  "Family Member"
                )}
              </Badge>
              <h2 className="text-2xl font-serif font-bold">{name}</h2>
              {birthYear && (
                <p className="text-white/80 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {birthYear}
                  {deathYear ? ` – ${deathYear}` : " – Present"}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Family relationship (for people only) */}
          {!isPet && member && (
            <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
              <Users className="w-4 h-4" />
              <span>Generation {member.generation + 1}</span>
              {member.spouseId && (
                <>
                  <span className="text-white/50">·</span>
                  <span>Married</span>
                </>
              )}
              {member.childIds && member.childIds.length > 0 && (
                <>
                  <span className="text-white/50">·</span>
                  <span>{member.childIds.length} children</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? isPet
                    ? "border-gold text-gold-dark"
                    : "border-sage text-sage"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile */}
              <div className="text-center">
                <div
                  className={`w-32 h-32 mx-auto mb-4 flex items-center justify-center ${
                    isPet
                      ? "rounded-2xl bg-gold-light ring-4 ring-gold-light/50"
                      : "rounded-full bg-sage-pale ring-4 ring-sage-pale/50"
                  }`}
                >
                  {isPet ? (
                    SpeciesIcon && (
                      <SpeciesIcon className="w-16 h-16 text-gold-dark" />
                    )
                  ) : (
                    <span className="text-4xl font-serif font-bold text-sage-dark">
                      {member!.firstName.charAt(0)}
                      {member!.lastName.charAt(0)}
                    </span>
                  )}
                </div>

                {hasMemorial ? (
                  <Badge className="bg-sage-pale text-sage-dark">
                    <Flower2 className="w-3 h-3 mr-1" />
                    Memorial Created
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    No memorial yet
                  </Badge>
                )}
              </div>

              {hasMemorial ? (
                <>
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

                  {/* AI Companion promo (for people only) */}
                  {!isPet && (
                    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-dark">
                              Talk with {displayName}
                            </h4>
                            <p className="text-sm text-gray-body mt-1">
                              Our AI Legacy Companion lets you have a
                              conversation that honors their memory.
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
                  )}

                  {/* View full memorial */}
                  <Link href={`/memorial/${memorialId}`}>
                    <Button className="w-full" variant="secondary">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Memorial
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* No memorial - create one */}
                  <div className="text-center py-4">
                    <p className="text-gray-body mb-4">
                      {isPet
                        ? `Create a memorial to honor ${pet!.name}'s memory.`
                        : `${displayName} doesn't have a memorial page yet. Create one to preserve their memory.`}
                    </p>
                    <Link href="/create">
                      <Button className="w-full">
                        <Flower2 className="w-4 h-4 mr-2" />
                        Create Memorial
                      </Button>
                    </Link>
                  </div>

                  {/* Add photos suggestion */}
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-sage" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-dark">
                          Add Photos
                        </h4>
                        <p className="text-sm text-gray-body mt-1">
                          Upload photos to create a more complete family record.
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Candle Tab */}
          {activeTab === "candle" && hasMemorial && memorialId && (
            <CandleLighting
              memorialId={memorialId}
              memorialName={name}
              userId={userId}
              userName={userName}
              demoMode
            />
          )}

          {/* Guestbook Tab */}
          {activeTab === "guestbook" && hasMemorial && memorialId && (
            <Guestbook
              memorialId={memorialId}
              memorialName={name}
              userId={userId}
              userName={userName}
              demoMode
            />
          )}

          {/* AI Companion Tab */}
          {activeTab === "companion" && hasMemorial && !isPet && member && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>Note:</strong> This AI companion is designed to
                  provide comfort by simulating conversations based on memorial
                  information. It is not a replacement for professional grief
                  support.
                </p>
              </div>
              <LegacyCompanion
                profile={{
                  name: `${member.firstName} ${member.lastName}`,
                  birthYear: member.birthYear?.toString(),
                  deathYear: member.deathYear?.toString(),
                }}
                userRelationship="family member"
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
            {hasMemorial && (
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
