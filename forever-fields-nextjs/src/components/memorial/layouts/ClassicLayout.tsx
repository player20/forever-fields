"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, Button } from "@/components/ui";
import {
  Calendar,
  MapPin,
  Heart,
  MessageCircle,
  Flower2,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import type { Memorial } from "@/types/memorial";

interface ClassicLayoutProps {
  memorial: Memorial;
  onLightCandle?: () => void;
  onViewGuestbook?: () => void;
  onShare?: () => void;
  onTrack?: (event: string, properties?: Record<string, unknown>) => void;
}

/**
 * Classic/Traditional Layout
 * Inspired by traditional newspaper obituaries with a clean, timeless design.
 * Single column, focused on readability and respect.
 */
export function ClassicLayout({
  memorial,
  onLightCandle,
  onViewGuestbook,
  onShare,
  onTrack,
}: ClassicLayoutProps) {
  const [obituaryExpanded, setObituaryExpanded] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fullName = [
    memorial.firstName,
    memorial.middleName,
    memorial.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const lifeSpan =
    memorial.birthDate && memorial.deathDate
      ? `${new Date(memorial.birthDate).getFullYear()} - ${new Date(memorial.deathDate).getFullYear()}`
      : "";

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with subtle border */}
      <div className="border-b-4 border-double border-gray-300 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {/* Decorative element */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gray-300" />
            <Flower2 className="w-6 h-6 text-sage" />
            <div className="h-px w-16 bg-gray-300" />
          </div>

          {/* Name */}
          <h1 className="font-serif text-4xl md:text-5xl text-gray-dark mb-2">
            {fullName}
          </h1>

          {/* Nickname */}
          {memorial.nickname && (
            <p className="text-xl text-gray-body italic mb-2">
              &ldquo;{memorial.nickname}&rdquo;
            </p>
          )}

          {/* Life span */}
          {lifeSpan && (
            <p className="text-lg text-gray-muted font-serif">{lifeSpan}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Photo and dates */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Photo */}
          {memorial.profilePhotoUrl && (
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="relative w-48 h-64 border-4 border-gray-200 shadow-lg">
                <Image
                  src={memorial.profilePhotoUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Vital information */}
          <div className="flex-grow">
            <Card className="p-6 bg-white/80">
              <h2 className="font-serif text-xl font-semibold text-gray-dark mb-4 border-b border-gray-200 pb-2">
                Life Details
              </h2>

              <div className="space-y-3">
                {memorial.birthDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-sage mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-muted">Born</p>
                      <p className="text-gray-dark">
                        {formatDate(memorial.birthDate)}
                      </p>
                      {memorial.birthPlace && (
                        <p className="text-sm text-gray-body">
                          {memorial.birthPlace}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {memorial.deathDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-sage mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-muted">Passed</p>
                      <p className="text-gray-dark">
                        {formatDate(memorial.deathDate)}
                      </p>
                    </div>
                  </div>
                )}

                {memorial.restingPlace && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-sage mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-muted">Resting Place</p>
                      <p className="text-gray-dark">{memorial.restingPlace}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Obituary */}
        {memorial.obituary && (
          <Card className="p-6 mb-8 bg-white/80">
            <h2 className="font-serif text-xl font-semibold text-gray-dark mb-4 border-b border-gray-200 pb-2">
              In Loving Memory
            </h2>

            <div
              className={`prose prose-gray max-w-none ${
                !obituaryExpanded && memorial.obituary.length > 500
                  ? "line-clamp-6"
                  : ""
              }`}
            >
              <p className="text-gray-body whitespace-pre-line first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-2 first-letter:leading-none">
                {memorial.obituary}
              </p>
            </div>

            {memorial.obituary.length > 500 && (
              <button
                onClick={() => setObituaryExpanded(!obituaryExpanded)}
                className="mt-4 text-sage hover:text-sage-dark flex items-center gap-1"
              >
                {obituaryExpanded ? (
                  <>
                    Read less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {memorial.allowCandleLighting && (
            <Button
              onClick={() => {
                onTrack?.("classic_candle_click");
                onLightCandle?.();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Light a Candle
            </Button>
          )}

          {memorial.allowGuestbook && (
            <Button
              onClick={() => {
                onTrack?.("classic_guestbook_click");
                onViewGuestbook?.();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Sign Guestbook
            </Button>
          )}

          <Button
            onClick={() => {
              onTrack?.("classic_share_click");
              onShare?.();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Footer decoration */}
        <div className="flex items-center justify-center gap-4 py-8">
          <div className="h-px w-24 bg-gray-300" />
          <Flower2 className="w-6 h-6 text-sage" />
          <div className="h-px w-24 bg-gray-300" />
        </div>

        <p className="text-center text-sm text-gray-muted font-serif italic">
          &ldquo;Those we love don&apos;t go away, they walk beside us every
          day.&rdquo;
        </p>
      </div>
    </div>
  );
}
