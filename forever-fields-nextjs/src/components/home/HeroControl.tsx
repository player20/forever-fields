"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  Avatar,
  AvatarGroup,
  Badge,
} from "@/components/ui";
import { FadeIn, SlideUp } from "@/components/motion";
import {
  Heart,
  Users,
  Star,
  ChevronRight,
  Play,
  Flame,
} from "lucide-react";

interface HeroControlProps {
  onCtaClick?: () => void;
}

export function HeroControl({ onCtaClick }: HeroControlProps) {
  const t = useTranslations();

  const handlePrimaryClick = () => {
    onCtaClick?.();
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sage-pale/50 via-cream to-cream" />

      {/* Decorative elements - warm and varied */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gold/15 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-rose/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-sage/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge
                variant="outline"
                size="lg"
                pill
                icon={<Heart className="w-4 h-4" />}
              >
                Forever Fields
              </Badge>
              <Badge
                variant="secondary"
                size="lg"
                pill
                className="bg-sage-pale/50"
              >
                Living memories for generations
              </Badge>
            </div>
          </FadeIn>

          <SlideUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-dark leading-tight mb-6">
              Where Love Becomes a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-dark via-sage to-gold-dark">
                Lasting Legacy
              </span>
            </h1>
          </SlideUp>

          <SlideUp delay={0.2}>
            <p className="text-lg sm:text-xl text-gray-body max-w-2xl mx-auto mb-6">
              Living digital memories that evolve with your family—stories, photos,
              and meaningful moments always close and experienced together over time.
            </p>
          </SlideUp>

          {/* Social proof - moved above preview */}
          <SlideUp delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <AvatarGroup
                avatars={[
                  { name: "Sarah M." },
                  { name: "Michael T." },
                  { name: "Eleanor K." },
                  { name: "James R." },
                  { name: "Linda P." },
                ]}
                max={5}
                size="md"
              />
              <div className="text-left">
                <div className="flex items-center gap-1 text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-body">
                  <span className="font-semibold text-sage-dark">50,000+ families</span> in 120+ countries
                </p>
              </div>
            </div>
          </SlideUp>
        </div>

        {/* Sample Memorial Preview */}
        <SlideUp delay={0.5}>
          <div className="mt-10 sm:mt-16 relative px-4 sm:px-0">
            <div className="max-w-4xl mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-sage-pale/50 to-white shadow-soft overflow-hidden border border-sage-pale/50">
              {/* Memorial Header */}
              <div className="bg-gradient-to-r from-twilight to-gray-dark p-5 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/20 mx-auto mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl font-serif text-white">
                  MJ
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Margaret Johnson</h3>
                <p className="text-white/80 mt-1 text-sm sm:text-base">1942 — 2024 · 81 years of love</p>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-white/70 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-gold" /> 47 candles
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-rose" /> 23 memories
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" /> 12 family
                  </span>
                </div>
              </div>
              {/* Memorial Content Preview */}
              <div className="p-4 sm:p-6 bg-white">
                <p className="text-gray-body italic text-center text-sm sm:text-base">
                  &quot;She taught us that love is not about grand gestures, but about showing up every day with kindness in your heart.&quot;
                </p>
                <p className="text-gray-body text-xs sm:text-sm text-center mt-2">— Emily, Granddaughter</p>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -left-4 top-1/4 hidden lg:block"
            >
              <Card className="p-4 shadow-medium w-48">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-pale flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-body">Memories</p>
                    <p className="font-semibold text-gray-dark">1,234</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -right-4 top-1/3 hidden lg:block"
            >
              <Card className="p-4 shadow-medium w-52">
                <div className="flex items-center gap-3">
                  <Avatar name="Margaret S." size="md" />
                  <div>
                    <p className="text-sm font-medium text-gray-dark">
                      Margaret S.
                    </p>
                    <p className="text-xs text-gray-body">1932 - 2023</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </SlideUp>

        {/* CTAs - positioned under memorial preview */}
        <SlideUp delay={0.6}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/create" onClick={handlePrimaryClick}>
              <Button size="lg" className="shadow-soft">
                {t("common.createMemorial")}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5 mr-2" />
              {t("home.hero.secondaryCta")}
            </Button>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
