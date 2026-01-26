"use client";

import { motion } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  FileText,
  Heart,
  Clock,
  Shield,
  CheckCircle,
  MessageSquare,
  Video,
  Mic,
  Calendar,
  Gift,
  ChevronRight,
  Lock,
} from "lucide-react";

const planningFeatures = [
  {
    icon: MessageSquare,
    title: "Write Your Story",
    description:
      "Document your life story, values, and lessons learned for future generations.",
  },
  {
    icon: Video,
    title: "Record Video Messages",
    description:
      "Leave personal video messages for birthdays, weddings, and milestones.",
  },
  {
    icon: Mic,
    title: "Preserve Your Voice",
    description:
      "Record stories and messages so your voice can comfort loved ones forever.",
  },
  {
    icon: Gift,
    title: "Schedule Future Gifts",
    description:
      "Arrange gifts and messages to be delivered on special occasions.",
  },
  {
    icon: Calendar,
    title: "Milestone Messages",
    description:
      "Write letters to be opened at graduation, marriage, and other life events.",
  },
  {
    icon: Lock,
    title: "Secure Vault",
    description:
      "Store important documents, passwords, and final wishes securely.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    description: "Begin documenting your legacy",
    features: [
      "Basic memorial page",
      "Up to 50 photos",
      "Text-based memories",
      "Family tree (3 generations)",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Family",
    price: "$9.99",
    period: "/month",
    description: "Complete legacy preservation",
    features: [
      "Everything in Starter",
      "Unlimited photos & videos",
      "Voice cloning (5 hours)",
      "Video messages",
      "Milestone messages",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Forever",
    price: "$299",
    period: "one-time",
    description: "Perpetual preservation",
    features: [
      "Everything in Family",
      "Lifetime storage",
      "Unlimited voice cloning",
      "Professional digitization",
      "Legacy Companion AI",
      "Family concierge",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PlanningPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sage-pale/50 to-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <Badge
                variant="outline"
                pill
                icon={<FileText className="w-4 h-4" />}
                className="mb-4"
              >
                Pre-Planning
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-dark mb-4">
                Plan Your Legacy Today
              </h1>
              <p className="text-lg text-gray-body mb-8">
                Give your family the gift of peace of mind. Document your wishes,
                preserve your voice, and create lasting messages for the future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Start Planning
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Heart,
                title: "Ease Their Burden",
                desc: "Remove uncertainty for your loved ones",
              },
              {
                icon: Clock,
                title: "Your Own Pace",
                desc: "Add content whenever you're ready",
              },
              {
                icon: Shield,
                title: "Completely Private",
                desc: "You control who sees what and when",
              },
              {
                icon: CheckCircle,
                title: "Peace of Mind",
                desc: "Know your legacy is preserved",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-1">{item.title}</h3>
                <p className="text-sm text-gray-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Everything You Need to Preserve Your Legacy
              </h2>
              <p className="text-lg text-gray-body">
                Our comprehensive tools help you document every aspect of your life
                for future generations.
              </p>
            </div>
          </SlideUp>

          <Stagger staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planningFeatures.map((feature) => (
                <StaggerItem key={feature.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full p-6 hover:shadow-hover transition-shadow">
                      <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-sage" />
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

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-b from-cream to-sage-pale/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="secondary" pill className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-dark mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-gray-body">
                Start free and upgrade when you&apos;re ready.
              </p>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`h-full p-6 ${
                    plan.highlighted
                      ? "border-2 border-sage shadow-hover"
                      : ""
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="mb-4">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-serif font-semibold text-gray-dark">
                    {plan.name}
                  </h3>
                  <div className="my-4">
                    <span className="text-4xl font-bold text-sage-dark">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-body">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-body mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                        <span className="text-gray-body">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "primary" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <div className="bg-gradient-to-r from-sage to-sage-dark rounded-3xl p-8 sm:p-12 text-white shadow-soft">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                Start Preserving Your Legacy Today
              </h2>
              <p className="text-lg text-sage-pale mb-8 max-w-2xl mx-auto">
                Join thousands of families who have found peace of mind through
                pre-planning.
              </p>
              <Button
                size="lg"
                className="bg-white text-sage-dark hover:bg-cream"
              >
                Begin Your Journey
              </Button>
            </div>
          </SlideUp>
        </div>
      </section>
    </div>
  );
}
