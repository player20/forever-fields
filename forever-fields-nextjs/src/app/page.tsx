"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Button,
  Card,
  Avatar,
  AvatarGroup,
  Badge,
} from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  Flower2,
  Heart,
  MessageSquare,
  Mic,
  Video,
  MapPin,
  Star,
  ChevronRight,
  Play,
  Sparkles,
  Shield,
  Clock,
  Globe,
  TreeDeciduous,
  BookOpen,
  Users,
} from "lucide-react";

// Feature cards data
const features = [
  {
    icon: MessageSquare,
    title: "AI Memory Assistant",
    description:
      "Get gentle help writing meaningful tributes. Our AI understands the sensitivity of your memories.",
    color: "sage",
  },
  {
    icon: Mic,
    title: "Voice Cloning",
    description:
      "Hear their voice again. Create personalized messages in their voice for special occasions.",
    color: "gold",
  },
  {
    icon: Video,
    title: "Animated Memories",
    description:
      "Bring photos to life with gentle animations. See them smile, wave, or share a message.",
    color: "twilight",
  },
  {
    icon: TreeDeciduous,
    title: "Family Tree",
    description:
      "Build and visualize your family connections. Import from GEDCOM or start fresh.",
    color: "sage",
  },
  {
    icon: MapPin,
    title: "Grave Locator",
    description:
      "Never forget where they rest. GPS navigation to the exact location.",
    color: "gold",
  },
  {
    icon: BookOpen,
    title: "Story Collection",
    description:
      "Guided interviews to capture family stories before they're lost to time.",
    color: "twilight",
  },
];

// Testimonials
const testimonials = [
  {
    quote:
      "Forever Fields helped me capture my grandmother's stories before she passed. Now my children can hear her voice reading bedtime stories.",
    author: "Sarah M.",
    role: "Mother of 3",
  },
  {
    quote:
      "The Legacy Companion let me have one more conversation with my dad. It's not him, but it carries his wisdom forward.",
    author: "Michael T.",
    role: "Son",
  },
  {
    quote:
      "Planning my own memorial took a weight off my children. They know my wishes, and I've left them messages for their futures.",
    author: "Eleanor K.",
    role: "Grandmother",
  },
];

// Stats
const stats = [
  { label: "Memorials Created", value: "50,000+" },
  { label: "Stories Preserved", value: "200,000+" },
  { label: "Families Connected", value: "15,000+" },
  { label: "Countries", value: "120+" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sage-pale/50 via-cream to-cream" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-sage/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn>
              <Badge
                variant="outline"
                size="lg"
                pill
                icon={<Sparkles className="w-4 h-4" />}
                className="mb-6"
              >
                AI-Powered Memorial Platform
              </Badge>
            </FadeIn>

            <SlideUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-dark leading-tight mb-6">
                Keep Their{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage to-sage-dark">
                  Legacy
                </span>{" "}
                Alive Forever
              </h1>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="text-lg sm:text-xl text-gray-body max-w-2xl mx-auto mb-8">
                Create beautiful digital memorials that grow with your family.
                Preserve stories, photos, and even their voice for generations
                to come.
              </p>
            </SlideUp>

            <SlideUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button size="lg" className="shadow-soft">
                    Start a Memorial
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </SlideUp>

            {/* Social proof */}
            <SlideUp delay={0.4}>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
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
                    Trusted by 50,000+ families worldwide
                  </p>
                </div>
              </div>
            </SlideUp>
          </div>

          {/* Hero image/illustration placeholder */}
          <SlideUp delay={0.5}>
            <div className="mt-16 relative">
              <div className="aspect-video max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-sage-pale to-white shadow-soft overflow-hidden border border-sage-pale/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
                      <Flower2 className="w-10 h-10 text-sage" />
                    </div>
                    <p className="text-gray-body">Memorial Preview</p>
                  </div>
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
                    <div className="w-10 h-10 rounded-full bg-sage-pale flex items-center justify-center">
                      <Heart className="w-5 h-5 text-sage" />
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-sage-dark">
                    {stat.value}
                  </p>
                  <p className="text-gray-body mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="secondary" pill className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Everything You Need to Preserve Their Legacy
              </h2>
              <p className="text-lg text-gray-body">
                From capturing memories to creating lasting tributes, our
                AI-powered tools help you honor their life beautifully.
              </p>
            </div>
          </SlideUp>

          <Stagger staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full p-6 hover:shadow-hover transition-shadow">
                      <div
                        className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                          feature.color === "sage"
                            ? "bg-sage-pale text-sage"
                            : feature.color === "gold"
                            ? "bg-gold/10 text-gold-dark"
                            : "bg-twilight/10 text-twilight"
                        }`}
                      >
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-serif font-semibold text-gray-dark mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-body">{feature.description}</p>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* For Children Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-sage-pale/30 to-gold/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <SlideUp>
              <div>
                <Badge
                  variant="outline"
                  pill
                  icon={<Heart className="w-4 h-4" />}
                  className="mb-4"
                >
                  For Children
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-6">
                  Help Children Connect with Ancestors They Never Met
                </h2>
                <p className="text-lg text-gray-body mb-8">
                  Age-appropriate experiences that grow with your children. From
                  bedtime stories to life advice, keep the connection alive
                  across generations.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    {
                      age: "Ages 4-7",
                      desc: "Picture books, audio stories, simple memories",
                    },
                    {
                      age: "Ages 8-12",
                      desc: '"When Grandma was your age" interactive missions',
                    },
                    {
                      age: "Ages 13+",
                      desc: "Life advice, wisdom keeper, Legacy Companion",
                    },
                    {
                      age: "Milestones",
                      desc: "Time-locked messages for graduation, wedding, etc.",
                    },
                  ].map((item) => (
                    <div key={item.age} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-sage flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-dark">{item.age}</p>
                        <p className="text-sm text-gray-body">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/demo/kids">
                  <Button variant="secondary" size="lg">
                    Try Kids Demo
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-white shadow-soft overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <span className="text-6xl mb-4 block">🧒</span>
                      <p className="font-serif text-xl text-sage-dark">
                        Kids Memorial Explorer
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-medium p-3"
                >
                  <span className="text-3xl">🌻</span>
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-medium p-3"
                >
                  <span className="text-3xl">💌</span>
                </motion.div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="secondary" pill className="mb-4">
                Testimonials
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark">
                Stories from Our Community
              </h2>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6">
                  <div className="flex gap-1 text-gold mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-body mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar name={testimonial.author} size="md" />
                    <div>
                      <p className="font-medium text-gray-dark">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-gray-body">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-sage-pale/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Shield,
                title: "Bank-Level Security",
                desc: "Your memories are encrypted and protected",
              },
              {
                icon: Clock,
                title: "Preserved Forever",
                desc: "Perpetual storage with disaster recovery",
              },
              {
                icon: Users,
                title: "Family Sharing",
                desc: "Collaborate with unlimited family members",
              },
              {
                icon: Globe,
                title: "Access Anywhere",
                desc: "View memorials from any device, anytime",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <div className="bg-gradient-to-r from-sage to-sage-dark rounded-3xl p-8 sm:p-12 text-white shadow-soft">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                Start Preserving Memories Today
              </h2>
              <p className="text-lg text-sage-pale mb-8 max-w-2xl mx-auto">
                Create a beautiful memorial in minutes. Free to start, with
                premium features for families who want more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-white text-sage-dark hover:bg-cream"
                  >
                    Create Free Memorial
                  </Button>
                </Link>
                <Link href="/planning">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-dark text-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-sage flex items-center justify-center">
                  <Flower2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-xl font-semibold">
                  Forever Fields
                </span>
              </div>
              <p className="text-gray-light text-sm">
                Preserving memories with compassion and technology.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  "Features",
                  "Pricing",
                  "For Funeral Homes",
                  "Mobile App",
                ],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Support",
                links: ["Help Center", "Privacy", "Terms", "Grief Resources"],
              },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-gray-light hover:text-cream transition-colors text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-body/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-light">
              © 2024 Forever Fields. All rights reserved.
            </p>
            <p className="text-sm text-gray-light">
              Built with Next.js 14 + Claude AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
