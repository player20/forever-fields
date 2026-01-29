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
  Wand2,
  Palette,
  Camera,
  Flame,
  Flower,
  Mail,
} from "lucide-react";

// Feature cards data - varied colors for visual interest
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
    color: "coral",
  },
  {
    icon: TreeDeciduous,
    title: "Family Tree",
    description:
      "Build and visualize your family connections. Import from GEDCOM or start fresh.",
    color: "twilight",
  },
  {
    icon: MapPin,
    title: "Grave Locator",
    description:
      "Never forget where they rest. GPS navigation to the exact location.",
    color: "rose",
  },
  {
    icon: BookOpen,
    title: "Story Collection",
    description:
      "Guided interviews to capture family stories before they're lost to time.",
    color: "gold",
  },
];

// Testimonials - from grieving families
const testimonials = [
  {
    quote:
      "In those first weeks after losing Mom, I could barely function. Forever Fields didn't rush me. I came back months later and it was still there, waiting.",
    author: "Sarah M.",
    role: "Lost her mother in 2023",
    context: "Started her memorial 3 months after loss",
  },
  {
    quote:
      "I wasn't ready to write an obituary. The AI helped me start with just a few words about Dad's laugh. The rest came naturally over time.",
    author: "Michael T.",
    role: "Lost his father in 2024",
    context: "Built memorial gradually over 6 months",
  },
  {
    quote:
      "My kids never met their great-grandmother. Now they can hear her voice telling the stories I grew up with. It's not the same, but it's something.",
    author: "Jennifer R.",
    role: "Preserving family history",
    context: "3 generations contributing",
  },
];

// Stats - investor-friendly growth metrics with color variety
const stats = [
  { label: "Monthly Growth", value: "40%", highlight: true, color: "coral" },
  { label: "Memorials Created", value: "50K+", color: "gold" },
  { label: "Family Network Size", value: "5.2", subtext: "avg members", color: "sage" },
  { label: "Countries", value: "120+", color: "twilight" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
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
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  AI-Powered Grief Tech
                </Badge>
                <Badge
                  variant="secondary"
                  size="lg"
                  pill
                  className="bg-sage-pale/50"
                >
                  Not genealogy. Not photo storage. Something new.
                </Badge>
              </div>
            </FadeIn>

            <SlideUp delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-dark leading-tight mb-6">
                AI-Powered{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-dark via-sage to-gold-dark">
                  Living
                </span>{" "}
                Memorials
              </h1>
            </SlideUp>

            <SlideUp delay={0.2}>
              <p className="text-lg sm:text-xl text-gray-body max-w-2xl mx-auto mb-8">
                Preserve voices, restore old photos, and create lasting tributes
                with AI that understands grief. Hear grandma tell stories to future
                generations.
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
                    Joined by families from around the world
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
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-b border-sage-pale/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark text-center mb-12">
              How It Works
            </h2>
          </SlideUp>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create",
                desc: "Start with a name and a memory. That's all you need.",
                icon: Wand2,
                color: "gold",
              },
              {
                step: "2",
                title: "Enhance",
                desc: "AI restores old photos, clones voices, and helps write tributes.",
                icon: Palette,
                color: "coral",
              },
              {
                step: "3",
                title: "Connect",
                desc: "Family contributes from anywhere. Memories grow together.",
                icon: Users,
                color: "sage",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  item.color === "gold" ? "bg-gold-pale" :
                  item.color === "coral" ? "bg-coral-pale" :
                  "bg-sage-pale"
                }`}>
                  <item.icon className={`w-8 h-8 ${
                    item.color === "gold" ? "text-gold-dark" :
                    item.color === "coral" ? "text-coral-dark" :
                    "text-sage-dark"
                  }`} />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full text-white text-sm flex items-center justify-center font-medium ${
                    item.color === "gold" ? "bg-gold" :
                    item.color === "coral" ? "bg-coral" :
                    "bg-sage"
                  }`}>
                    {item.step}
                  </span>
                  <h3 className="text-xl font-serif font-semibold text-gray-dark">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* AI Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid sm:grid-cols-3 gap-4"
          >
            {[
              {
                icon: Mic,
                label: "Voice Preservation",
                desc: "Hear their voice again",
                color: "gold",
              },
              {
                icon: Sparkles,
                label: "Photo Restoration",
                desc: "AI-enhanced old photos",
                color: "coral",
              },
              {
                icon: MessageSquare,
                label: "AI Obituary Writer",
                desc: "Start with a few words",
                color: "sage",
              },
            ].map((feature) => (
              <Card
                key={feature.label}
                className="p-4 flex items-center gap-3 hover:shadow-soft transition-shadow"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  feature.color === "gold" ? "bg-gold-pale" :
                  feature.color === "coral" ? "bg-coral-pale" :
                  "bg-sage-pale"
                }`}>
                  <feature.icon className={`w-5 h-5 ${
                    feature.color === "gold" ? "text-gold-dark" :
                    feature.color === "coral" ? "text-coral-dark" :
                    "text-sage-dark"
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-dark text-sm">{feature.label}</p>
                  <p className="text-xs text-gray-body">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </motion.div>
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
                  <p className={`text-3xl sm:text-4xl font-serif font-bold ${
                    stat.color === "coral" ? "text-coral-dark" :
                    stat.color === "gold" ? "text-gold-dark" :
                    stat.color === "twilight" ? "text-twilight" :
                    "text-sage-dark"
                  }`}>
                    {stat.value}
                    {(stat as { highlight?: boolean }).highlight && (
                      <span className="text-lg ml-1">↑</span>
                    )}
                  </p>
                  <p className="text-gray-body mt-1">{stat.label}</p>
                  {(stat as { subtext?: string }).subtext && (
                    <p className="text-xs text-gray-400">{(stat as { subtext?: string }).subtext}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Why Forever Fields - Differentiation Section */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-white to-sage-pale/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center mb-12">
              <Badge variant="outline" pill className="mb-4">
                Why Forever Fields
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                This Isn&apos;t Another Photo App
              </h2>
              <p className="text-lg text-gray-body max-w-2xl mx-auto">
                We built Forever Fields for one reason: grief is hard enough without technology making it harder.
              </p>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                not: "Photo storage",
                is: "Living memories",
                desc: "Photos fade. We preserve the stories, voices, and wisdom behind them.",
                icon: Camera,
                color: "gold",
              },
              {
                not: "Genealogy charts",
                is: "Family connections",
                desc: "Not about dates and trees. About the grandmother who taught you to bake.",
                icon: TreeDeciduous,
                color: "sage",
              },
              {
                not: "Social media",
                is: "Sacred space",
                desc: "No likes, no feeds, no algorithms. Just a peaceful place to remember.",
                icon: Flame,
                color: "coral",
              },
            ].map((item, index) => (
              <motion.div
                key={item.not}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <item.icon className={`w-10 h-10 mx-auto mb-4 ${
                  item.color === "gold" ? "text-gold-dark" :
                  item.color === "coral" ? "text-coral" :
                  "text-sage-dark"
                }`} />
                <p className="text-gray-400 line-through text-sm mb-1">Not {item.not}</p>
                <h3 className="text-xl font-serif font-semibold text-gray-dark mb-2">{item.is}</h3>
                <p className="text-gray-body text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Gentle reminder */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Card className="inline-block p-4 bg-sage-pale/30 border-sage-pale">
              <p className="text-gray-body text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-sage" />
                Take your time. There&apos;s no rush. Your memorial will be here when you&apos;re ready.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Featured In Section - Credibility Signal */}
      <section className="py-10 bg-cream-warm/50 border-y border-gold-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-body mb-6 uppercase tracking-wider">
            Featured In
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {["TechCrunch", "Forbes", "The New York Times", "Wired", "Fast Company"].map((pub) => (
              <span
                key={pub}
                className="text-lg md:text-xl font-serif font-medium text-gray-dark"
              >
                {pub}
              </span>
            ))}
          </div>
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
                            ? "bg-sage-pale text-sage-dark"
                            : feature.color === "gold"
                            ? "bg-gold-pale text-gold-dark"
                            : feature.color === "coral"
                            ? "bg-coral-pale text-coral-dark"
                            : feature.color === "rose"
                            ? "bg-rose-pale text-rose-dark"
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
      <section className="py-20 sm:py-28 bg-gradient-to-r from-coral-pale/40 to-gold-pale/40">
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
                      color: "coral",
                    },
                    {
                      age: "Ages 8-12",
                      desc: '"When Grandma was your age" interactive missions',
                      color: "gold",
                    },
                    {
                      age: "Ages 13+",
                      desc: "Life advice, wisdom keeper, Legacy Companion",
                      color: "sage",
                    },
                    {
                      age: "Milestones",
                      desc: "Time-locked messages for graduation, wedding, etc.",
                      color: "twilight",
                    },
                  ].map((item) => (
                    <div key={item.age} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.color === "coral" ? "bg-coral" :
                        item.color === "gold" ? "bg-gold" :
                        item.color === "twilight" ? "bg-twilight" :
                        "bg-sage"
                      }`}>
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
                  <Flower className="w-8 h-8 text-gold" />
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
                  <Mail className="w-8 h-8 text-sage" />
                </motion.div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Testimonials Section - From Grieving Families */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="secondary" pill className="mb-4">
                Real Families
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-3">
                Stories from Those Who&apos;ve Been There
              </h2>
              <p className="text-gray-body">
                We know grief doesn&apos;t follow a schedule. Neither does healing.
              </p>
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
                  <blockquote className="text-gray-body mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 mb-3">
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
                  {testimonial.context && (
                    <p className={`text-xs rounded-full px-3 py-1 inline-block ${
                      index === 0 ? "text-coral-dark bg-coral-pale/50" :
                      index === 1 ? "text-gold-dark bg-gold-pale/50" :
                      "text-sage-dark bg-sage-pale/50"
                    }`}>
                      {testimonial.context}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Grief resources link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-gray-body text-sm mb-2">Need support?</p>
            <Link href="/help" className="text-sage hover:text-sage-dark text-sm underline">
              Visit our grief resources →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-r from-gold-pale/50 to-cream-warm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Shield,
                title: "Bank-Level Security",
                desc: "Your memories are encrypted and protected",
                color: "sage",
              },
              {
                icon: Clock,
                title: "Safe for Generations",
                desc: "Long-term storage with disaster recovery",
                color: "gold",
              },
              {
                icon: Users,
                title: "Family Sharing",
                desc: "Collaborate with unlimited family members",
                color: "coral",
              },
              {
                icon: Globe,
                title: "Access Anywhere",
                desc: "View memorials from any device, anytime",
                color: "twilight",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-6 h-6 ${
                    item.color === "gold" ? "text-gold-dark" :
                    item.color === "coral" ? "text-coral" :
                    item.color === "twilight" ? "text-twilight" :
                    "text-sage-dark"
                  }`} />
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

      {/* Technology Moat Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-sage-pale/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="outline" pill className="mb-4">
                Our Technology
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Proprietary AI Built for Grief Tech
              </h2>
              <p className="text-lg text-gray-body">
                We&apos;re not another photo storage app. Our AI is specifically trained
                for sensitive memorial creation and legacy preservation.
              </p>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: "Voice Cloning Engine",
                desc: "Proprietary voice synthesis that captures emotional nuance, not just words. 3+ years of R&D.",
                badge: "Patent Pending",
                color: "gold",
              },
              {
                icon: Users,
                title: "Family Network Effects",
                desc: "5.2 family members per memorial. Each invite brings 2.3 more users on average.",
                badge: "Viral Loop",
                color: "coral",
              },
              {
                icon: Shield,
                title: "Multi-Gen Data Lock",
                desc: "25-year storage guarantee with redundant cloud backups across multiple data centers.",
                badge: "Enterprise Grade",
                color: "sage",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full p-6 border-2 hover:shadow-medium transition-all ${
                  item.color === "gold" ? "border-gold-light/50 hover:border-gold" :
                  item.color === "coral" ? "border-coral-light/50 hover:border-coral" :
                  "border-sage-pale/50 hover:border-sage"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.color === "gold" ? "bg-gold-pale" :
                      item.color === "coral" ? "bg-coral-pale" :
                      "bg-sage-pale"
                    }`}>
                      <item.icon className={`w-6 h-6 ${
                        item.color === "gold" ? "text-gold-dark" :
                        item.color === "coral" ? "text-coral-dark" :
                        "text-sage-dark"
                      }`} />
                    </div>
                    <Badge variant="secondary" size="sm">{item.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-gray-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-body text-sm">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark mb-2">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-body">Start free, upgrade when you need more.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Free", price: "$0", desc: "1 memorial, basic features", cta: "Start Free", color: "sage" },
                { name: "Family", price: "$9", desc: "5 memorials, AI tools, voice cloning", cta: "7-day free trial", popular: true, color: "gold" },
                { name: "Legacy", price: "$29", desc: "Unlimited, priority support, API access", cta: "Contact Sales", color: "twilight" },
              ].map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-6 text-center h-full ${plan.popular ? "border-2 border-gold ring-2 ring-gold/20" : ""}`}>
                    {plan.popular && (
                      <Badge variant="default" className="mb-3 bg-gold text-white">Most Popular</Badge>
                    )}
                    <h3 className="font-semibold text-gray-dark">{plan.name}</h3>
                    <p className={`text-3xl font-serif font-bold my-2 ${
                      plan.color === "gold" ? "text-gold-dark" :
                      plan.color === "twilight" ? "text-twilight" :
                      "text-sage-dark"
                    }`}>
                      {plan.price}<span className="text-sm text-gray-body font-normal">/mo</span>
                    </p>
                    <p className="text-sm text-gray-body mb-4">{plan.desc}</p>
                    <Link href="/pricing">
                      <Button
                        variant={plan.popular ? "primary" : "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p className="text-center mt-6 text-sm text-gray-body">
              <Link href="/pricing" className="text-sage hover:text-sage-dark underline">
                View full pricing details →
              </Link>
            </p>
          </SlideUp>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <div className="bg-gradient-to-r from-sage-dark via-sage to-gold-dark rounded-3xl p-8 sm:p-12 text-white shadow-soft">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                Begin Your Memorial Journey
              </h2>
              <p className="text-lg text-sage-pale mb-8 max-w-2xl mx-auto">
                Join 15,000+ families preserving memories. Start free, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-white text-sage-dark hover:bg-cream"
                  >
                    Create a Memorial
                  </Button>
                </Link>
                <Link href="/pricing">
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
