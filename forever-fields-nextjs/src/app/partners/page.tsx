"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  Flower2,
  MapPin,
  QrCode,
  Users,
  Heart,
  ChevronRight,
  CheckCircle2,
  Building2,
  BarChart3,
  Clock,
  Shield,
  Star,
  Sparkles,
} from "lucide-react";

// How it works steps
const steps = [
  {
    number: "1",
    icon: Building2,
    title: "Cemetery Signs Up Free",
    description:
      "Register your cemetery in minutes. No fees, no commitments. Just a simple form with your cemetery details.",
  },
  {
    number: "2",
    icon: QrCode,
    title: "Generate QR Codes",
    description:
      "Create QR codes for each plot. Print them on plaques, give them to families, or add to headstones later.",
  },
  {
    number: "3",
    icon: Users,
    title: "Families Add Memories",
    description:
      "Families scan the QR code and add photos, stories, and tributes. They do the work, you provide the gift.",
  },
];

// Benefits for cemeteries
const benefits = [
  {
    icon: Heart,
    title: "Meaningful Service",
    description:
      "Offer families something beyond a plot — a living digital tribute that grows over generations.",
  },
  {
    icon: MapPin,
    title: "Grave Locator Included",
    description:
      "Visitors can navigate directly to the grave using GPS. No more families wandering lost.",
  },
  {
    icon: BarChart3,
    title: "See the Impact",
    description:
      "View how many visitors light candles, share memories, and visit memorials in your cemetery.",
  },
  {
    icon: Clock,
    title: "Preserve History",
    description:
      "Digitize your oldest graves. Historical societies and genealogists will thank you.",
  },
  {
    icon: Shield,
    title: "Your Branding",
    description:
      "Your cemetery name appears on every memorial. Build recognition in your community.",
  },
  {
    icon: Sparkles,
    title: "Zero Effort Setup",
    description:
      "Families create and maintain their own memorials. You just hand them the QR code.",
  },
];

// What families get (free)
const familyFeatures = [
  "Unlimited photos and memories",
  "Virtual candle lighting",
  "Guestbook for visitors",
  "Life timeline",
  "Family tree connections",
  "Share via link or QR code",
];

// Premium features (families pay if they want)
const premiumFeatures = [
  "Time capsules (reveal on future dates)",
  "Voice cloning and messages",
  "Animated photo memories",
  "AI-powered tribute writing",
  "Blockchain permanence guarantee",
];

// Testimonial placeholder
const testimonial = {
  quote:
    "Forever Fields helped us offer families something meaningful at no cost to us. The first time a widow showed me her phone with her husband's memorial, I knew we made the right choice.",
  author: "Coming Soon",
  role: "Cemetery Director testimonial",
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-sage-pale/30 to-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
                <Building2 className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-gray-dark">
                  Cemetery Partnership Program
                </span>
              </div>
            </FadeIn>

            <SlideUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-twilight mb-6">
                Help Families Keep{" "}
                <span className="text-sage">Memories Alive</span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="text-lg sm:text-xl text-gray-body mb-8 max-w-2xl mx-auto">
                Offer every family a free digital memorial for their loved one.
                QR codes on headstones connect visitors to photos, stories, and
                tributes that last forever.
              </p>
            </SlideUp>

            <SlideUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/partners/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Register Your Cemetery — Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Request a Demo
                </Button>
              </div>
            </SlideUp>

            <SlideUp delay={0.4}>
              <p className="mt-6 text-sm text-gray-body">
                <span className="font-semibold text-sage">100% free</span> for
                cemeteries. No hidden fees. No contracts.
              </p>
            </SlideUp>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-sage-pale/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gold-light/30 rounded-full blur-3xl" />
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
                How It Works
              </h2>
              <p className="text-gray-body max-w-2xl mx-auto">
                Three simple steps to offer families something meaningful
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <StaggerItem key={step.title}>
                <Card className="p-6 h-full relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="absolute top-4 right-4 text-6xl font-serif font-bold text-sage-pale/50">
                    {step.number}
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-sage" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-twilight mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-body">{step.description}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* What Families Get - Free */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-pale rounded-full text-sage text-sm font-medium mb-4">
                  <Heart className="w-4 h-4" />
                  Free for Families
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
                  Every Memorial Includes
                </h2>
                <p className="text-gray-body mb-8">
                  When you partner with us, every family gets a full-featured
                  digital memorial at no cost. You give them the QR code — they
                  do the rest.
                </p>

                <ul className="space-y-3">
                  {familyFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                      <span className="text-gray-dark">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <SlideUp delay={0.2}>
              <Card className="p-6 bg-gradient-to-br from-sage-pale/30 to-cream">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-sage" />
                  </div>
                  <p className="text-sm text-gray-body">
                    Scan to see a sample memorial
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center text-sage font-serif font-bold">
                      MJ
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-twilight">
                        Margaret Johnson
                      </h4>
                      <p className="text-sm text-gray-body">1942 — 2024</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-body">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-rose" /> 47 candles
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-sage" /> 23 memories
                    </span>
                  </div>
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Premium Features (Optional for Families) */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-cream to-sage-pale/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-light/50 rounded-full text-gold text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Optional Upgrades
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
                Families Choose If They Want More
              </h2>
              <p className="text-gray-body max-w-2xl mx-auto">
                Some families want premium features. They pay us directly — you
                don&apos;t handle any transactions. Basic memorials are always
                free.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 flex items-center gap-3 bg-white/80 backdrop-blur-sm">
                  <Star className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-gray-dark text-sm">{feature}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Cemeteries */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
                Why Cemeteries Partner With Us
              </h2>
              <p className="text-gray-body max-w-2xl mx-auto">
                It costs you nothing and gives families something meaningful
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <StaggerItem key={benefit.title}>
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center mb-4">
                    <benefit.icon className="w-5 h-5 text-sage" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-twilight mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-body text-sm">{benefit.description}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Testimonial Placeholder */}
      <section className="py-16 sm:py-24 bg-sage-pale/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <Card className="p-8 sm:p-12 text-center bg-white">
              <div className="w-16 h-16 rounded-full bg-sage-pale mx-auto mb-6 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-sage" />
              </div>
              <blockquote className="text-xl sm:text-2xl font-serif text-twilight mb-6 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="text-gray-body">
                <p className="font-medium text-gray-dark">{testimonial.author}</p>
                <p className="text-sm">{testimonial.role}</p>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-twilight text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <Flower2 className="w-12 h-12 text-sage-pale mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Ready to Help Families Preserve Memories?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join the growing network of cemeteries offering digital memorials.
              Setup is free and takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/partners/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-sage hover:bg-sage-dark"
                >
                  Register Your Cemetery
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-twilight/95 text-white/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flower2 className="w-6 h-6 text-sage-pale" />
              <span className="font-serif font-bold text-white">
                Forever Fields
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
