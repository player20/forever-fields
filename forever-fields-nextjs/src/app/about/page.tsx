"use client";

import Link from "next/link";
import { Header } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { FadeIn, SlideUp } from "@/components/motion";
import {
  Flower2,
  Heart,
  Users,
  Shield,
  Globe,
  Sparkles,
  Mail,
} from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Compassion First",
    description:
      "We understand that grief is deeply personal. Every feature we build is designed with empathy and care.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description:
      "Your memories are precious. We use enterprise-grade security to protect your family's stories.",
  },
  {
    icon: Users,
    title: "Family-Centered",
    description:
      "Memorials are meant to be shared. We make it easy for families to collaborate and contribute together.",
  },
  {
    icon: Globe,
    title: "Accessible Everywhere",
    description:
      "Whether you're at home or visiting a graveside, access your memorial from any device.",
  },
];

const _team = [
  {
    name: "Coming Soon",
    role: "Founder & CEO",
    bio: "Team bios will be added as the company grows.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-sage-pale/30 to-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
              <Flower2 className="w-4 h-4 text-sage" />
              <span className="text-sm font-medium text-gray-dark">
                About Forever Fields
              </span>
            </div>
          </FadeIn>

          <SlideUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-twilight mb-6">
              Preserving Memories,{" "}
              <span className="text-sage">One Story at a Time</span>
            </h1>
          </SlideUp>

          <SlideUp delay={0.2}>
            <p className="text-lg text-gray-body max-w-2xl mx-auto">
              Forever Fields was born from a simple belief: every life deserves
              to be remembered. We create digital memorials that help families
              preserve, share, and celebrate the stories of those they love.
            </p>
          </SlideUp>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-6">
                  Our Mission
                </h2>
                <div className="space-y-4 text-gray-body">
                  <p>
                    We believe that memories shouldn&apos;t fade with time. In an
                    age where so much of our lives exist digitally, we wanted to
                    create a place where the stories of our loved ones can live
                    on—beautifully preserved and easily shared with future
                    generations.
                  </p>
                  <p>
                    Forever Fields combines thoughtful design with powerful
                    technology to help families create living tributes. From
                    photos and stories to voice memories and family trees, we
                    provide the tools to capture what made someone special.
                  </p>
                  <p>
                    Whether you&apos;re honoring someone who recently passed or
                    preserving memories of grandparents for future generations,
                    we&apos;re here to help you tell their story.
                  </p>
                </div>
              </div>
            </FadeIn>

            <SlideUp delay={0.2}>
              <Card className="p-8 bg-gradient-to-br from-sage-pale/50 to-cream">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-sage mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold text-twilight mb-4">
                    Why Digital Memorials?
                  </h3>
                  <ul className="text-left space-y-3 text-gray-body">
                    <li className="flex items-start gap-2">
                      <span className="text-sage font-bold">•</span>
                      Accessible from anywhere, anytime
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sage font-bold">•</span>
                      Multiple family members can contribute
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sage font-bold">•</span>
                      Photos and videos preserved forever
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sage font-bold">•</span>
                      Share with distant relatives easily
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sage font-bold">•</span>
                      QR codes connect physical memorials
                    </li>
                  </ul>
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
                Our Values
              </h2>
              <p className="text-gray-body max-w-2xl mx-auto">
                Everything we do is guided by these core principles
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <SlideUp key={value.title} delay={index * 0.1}>
                <Card className="p-6 h-full text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-twilight mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-body">{value.description}</p>
                </Card>
              </SlideUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-twilight text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <Flower2 className="w-12 h-12 text-sage-pale mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Ready to Preserve Your Memories?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Create a free memorial today and start sharing the stories that
              matter most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-sage hover:bg-sage-dark"
                >
                  Create Memorial
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
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
