"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, Button, Badge } from "@/components/ui";
import {
  Calendar,
  Heart,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Star,
  FileText,
  Flower2,
  Share2,
  Plus,
} from "lucide-react";
import type { Memorial } from "@/types/memorial";

interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description?: string;
  type: "birth" | "education" | "career" | "family" | "achievement" | "death" | "milestone";
  icon?: React.ComponentType<{ className?: string }>;
}

interface TimelineLayoutProps {
  memorial: Memorial;
  events?: TimelineEvent[];
  onLightCandle?: () => void;
  onViewGuestbook?: () => void;
  onShare?: () => void;
  onAddEvent?: () => void;
  onTrack?: (event: string, properties?: Record<string, unknown>) => void;
}

const eventIcons: Record<TimelineEvent["type"], React.ComponentType<{ className?: string }>> = {
  birth: Calendar,
  education: GraduationCap,
  career: Briefcase,
  family: Heart,
  achievement: Star,
  death: Flower2,
  milestone: Calendar,
};

const eventColors: Record<TimelineEvent["type"], string> = {
  birth: "bg-green-100 text-green-600 border-green-200",
  education: "bg-blue-100 text-blue-600 border-blue-200",
  career: "bg-purple-100 text-purple-600 border-purple-200",
  family: "bg-pink-100 text-pink-600 border-pink-200",
  achievement: "bg-yellow-100 text-yellow-600 border-yellow-200",
  death: "bg-gray-100 text-gray-600 border-gray-200",
  milestone: "bg-sage-pale text-sage border-sage-light",
};

/**
 * Timeline Layout
 * Displays the memorial as a visual timeline of life events.
 * Great for celebrating achievements and milestones.
 */
export function TimelineLayout({
  memorial,
  events: providedEvents,
  onLightCandle,
  onViewGuestbook,
  onShare,
  onAddEvent,
  onTrack,
}: TimelineLayoutProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const fullName = [memorial.firstName, memorial.middleName, memorial.lastName]
    .filter(Boolean)
    .join(" ");

  // Generate default events from memorial data
  const defaultEvents: TimelineEvent[] = [];

  if (memorial.birthDate) {
    defaultEvents.push({
      id: "birth",
      year: new Date(memorial.birthDate).getFullYear(),
      title: `Born${memorial.birthPlace ? ` in ${memorial.birthPlace}` : ""}`,
      type: "birth",
    });
  }

  if (memorial.deathDate) {
    defaultEvents.push({
      id: "death",
      year: new Date(memorial.deathDate).getFullYear(),
      title: `Passed Away${memorial.restingPlace ? ` - Resting at ${memorial.restingPlace}` : ""}`,
      type: "death",
    });
  }

  const events = providedEvents?.length
    ? providedEvents
    : defaultEvents;

  // Sort events by year
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* Hero header */}
      <div className="relative bg-sage-dark text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Photo */}
            {memorial.profilePhotoUrl && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl"
              >
                <Image
                  src={memorial.profilePhotoUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              </motion.div>
            )}

            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
                {fullName}
              </h1>
              {memorial.nickname && (
                <p className="text-sage-light text-lg mb-1">
                  &ldquo;{memorial.nickname}&rdquo;
                </p>
              )}
              {memorial.birthDate && memorial.deathDate && (
                <p className="text-white/80">
                  {new Date(memorial.birthDate).getFullYear()} -{" "}
                  {new Date(memorial.deathDate).getFullYear()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-cream" style={{
          clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 100%)",
        }} />
      </div>

      {/* Timeline section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-gray-dark">
            Life Timeline
          </h2>
          {onAddEvent && (
            <Button
              onClick={onAddEvent}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </Button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-sage-light transform md:-translate-x-1/2" />

          {/* Events */}
          <div className="space-y-8">
            {sortedEvents.map((event, index) => {
              const Icon = event.icon || eventIcons[event.type];
              const colorClass = eventColors[event.type];
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-start gap-4 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  onClick={() => {
                    setSelectedEvent(selectedEvent === event.id ? null : event.id);
                    onTrack?.("timeline_event_click", { eventId: event.id, eventType: event.type });
                  }}
                >
                  {/* Year marker (mobile) */}
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-sage flex items-center justify-center shadow-md z-10 md:hidden">
                    <span className="text-xs font-bold text-sage">
                      {event.year}
                    </span>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 ${isEven ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                    <Card
                      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                        selectedEvent === event.id ? "ring-2 ring-sage" : ""
                      }`}
                    >
                      <div className={`flex items-start gap-3 ${isEven ? "md:flex-row-reverse" : ""}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} border`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 mb-1 ${isEven ? "md:justify-end" : ""}`}>
                            <Badge variant="outline" className="text-xs">
                              {event.year}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-dark">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-gray-body mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Year marker (desktop) */}
                  <div className="hidden md:flex absolute left-1/2 top-4 transform -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-sage items-center justify-center shadow-md z-10">
                    <span className="text-sm font-bold text-sage">
                      {event.year}
                    </span>
                  </div>

                  {/* Spacer for opposite side on desktop */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Obituary section */}
        {memorial.obituary && (
          <Card className="p-6 mt-12">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-sage" />
              <h2 className="text-xl font-serif font-semibold text-gray-dark">
                Remembrance
              </h2>
            </div>
            <p className="text-gray-body whitespace-pre-line">
              {memorial.obituary}
            </p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mt-12 pt-8 border-t border-gray-100">
          {memorial.allowCandleLighting && (
            <Button
              onClick={() => {
                onTrack?.("timeline_candle_click");
                onLightCandle?.();
              }}
              className="flex items-center gap-2 bg-coral hover:bg-coral-dark"
            >
              <Heart className="w-4 h-4" />
              Light a Candle
            </Button>
          )}

          {memorial.allowGuestbook && (
            <Button
              onClick={() => {
                onTrack?.("timeline_guestbook_click");
                onViewGuestbook?.();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Leave a Message
            </Button>
          )}

          <Button
            onClick={() => {
              onTrack?.("timeline_share_click");
              onShare?.();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Memorial
          </Button>
        </div>
      </div>
    </div>
  );
}
