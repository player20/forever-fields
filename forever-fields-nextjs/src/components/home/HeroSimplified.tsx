"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { SlideUp } from "@/components/motion";
import { ChevronRight } from "lucide-react";

interface HeroSimplifiedProps {
  onCtaClick?: () => void;
}

export function HeroSimplified({ onCtaClick }: HeroSimplifiedProps) {
  const t = useTranslations();

  const handlePrimaryClick = () => {
    onCtaClick?.();
  };

  return (
    <section className="relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sage-pale/30 to-cream" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="text-center">
          <SlideUp>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-dark leading-tight mb-6">
              Where Love Becomes a{" "}
              <span className="text-sage">Lasting Legacy</span>
            </h1>
          </SlideUp>

          <SlideUp delay={0.1}>
            <p className="text-xl sm:text-2xl text-gray-body max-w-2xl mx-auto mb-10">
              Living digital memories that evolve with your family—stories, photos, and meaningful moments always close.
            </p>
          </SlideUp>

          <SlideUp delay={0.2}>
            <Link href="/create" onClick={handlePrimaryClick}>
              <Button size="lg" className="shadow-soft text-lg px-8 py-4">
                {t("common.createMemorial")}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-body">
              Free to start · No credit card required
            </p>
          </SlideUp>

          {/* Simple social proof */}
          <SlideUp delay={0.3}>
            <div className="mt-16 flex items-center justify-center gap-2 text-gray-body">
              <span className="text-2xl font-serif font-bold text-sage-dark">15,000+</span>
              <span>families preserving memories</span>
            </div>
          </SlideUp>
        </div>
      </div>
    </section>
  );
}
