"use client";

import { motion } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  Video,
  FileText,
  Heart,
  Shield,
  CreditCard,
  Users,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const helpCategories = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of creating and managing memorials",
    articles: 12,
    color: "sage",
  },
  {
    icon: Heart,
    title: "Memorial Features",
    description: "Explore all the ways to honor your loved ones",
    articles: 24,
    color: "rose",
  },
  {
    icon: Users,
    title: "Family & Sharing",
    description: "Invite family members and collaborate together",
    articles: 8,
    color: "coral",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Control who can see and contribute to memorials",
    articles: 6,
    color: "twilight",
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Manage subscriptions and payment methods",
    articles: 10,
    color: "gold",
  },
  {
    icon: FileText,
    title: "Pre-Planning",
    description: "Plan your own legacy and preserve your wishes",
    articles: 15,
    color: "sage",
  },
];

const popularArticles = [
  "How to create your first memorial",
  "Inviting family members to contribute",
  "Uploading and organizing photos",
  "Setting up voice cloning",
  "Creating milestone messages",
  "Managing privacy settings",
];

const faqs = [
  {
    question: "How do I create a memorial?",
    answer:
      "Click 'Create Memorial' from any page, then follow the guided setup to add basic information, photos, and invite family members.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, we use bank-level encryption and your data is stored securely with multiple backups. You control all privacy settings.",
  },
  {
    question: "Can I invite family members?",
    answer:
      "Absolutely! You can invite unlimited family members to view or contribute to memorials. Each person can have different permission levels.",
  },
  {
    question: "What happens to my memorial long-term?",
    answer:
      "With our Forever plan, your memorial is preserved in perpetuity. We have provisions in place to ensure your data survives even if something happens to our company.",
  },
];

// Quick answers for immediate help
const quickAnswers = [
  {
    question: "How do I start?",
    answer: "Click 'Create Memorial' and follow the simple steps. You only need a name to begin.",
    icon: "✨",
  },
  {
    question: "Can I take my time?",
    answer: "Absolutely. Your progress saves automatically. Come back whenever you're ready.",
    icon: "🕐",
  },
  {
    question: "Is it private?",
    answer: "Yes. Memorials are private by default. You control exactly who can see and contribute.",
    icon: "🔒",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gold-pale/40 via-cream to-coral-pale/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <Badge
                variant="outline"
                pill
                icon={<HelpCircle className="w-4 h-4" />}
                className="mb-4"
              >
                Help Center
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-dark mb-4">
                How Can We Help?
              </h1>
              <p className="text-lg text-gray-body mb-8">
                Find answers, guides, and support for all your questions.
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-body" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-sage-pale bg-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-lg shadow-soft"
                />
              </div>

              {/* Quick Answers - Most Common Questions */}
              <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {quickAnswers.map((item) => (
                  <div
                    key={item.question}
                    className="bg-white rounded-xl p-4 shadow-soft text-left"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h3 className="font-medium text-gray-dark text-sm mb-1">
                      {item.question}
                    </h3>
                    <p className="text-xs text-gray-body">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <h2 className="text-2xl font-serif font-bold text-gray-dark mb-8 text-center">
              Browse by Category
            </h2>
          </SlideUp>

          <Stagger staggerDelay={0.05}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category) => (
                <StaggerItem key={category.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full p-6 hover:shadow-hover transition-shadow cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          category.color === "sage" ? "bg-sage-pale" :
                          category.color === "rose" ? "bg-rose-pale" :
                          category.color === "coral" ? "bg-coral-pale" :
                          category.color === "gold" ? "bg-gold-pale" :
                          "bg-twilight/10"
                        }`}>
                          <category.icon className={`w-6 h-6 ${
                            category.color === "sage" ? "text-sage-dark" :
                            category.color === "rose" ? "text-rose-dark" :
                            category.color === "coral" ? "text-coral-dark" :
                            category.color === "gold" ? "text-gold-dark" :
                            "text-twilight"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-serif font-semibold text-gray-dark mb-1">
                            {category.title}
                          </h3>
                          <p className="text-sm text-gray-body mb-2">
                            {category.description}
                          </p>
                          <p className={`text-xs ${
                            category.color === "sage" ? "text-sage" :
                            category.color === "rose" ? "text-rose" :
                            category.color === "coral" ? "text-coral" :
                            category.color === "gold" ? "text-gold" :
                            "text-twilight"
                          }`}>
                            {category.articles} articles
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <SlideUp>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-dark mb-6">
                  Popular Articles
                </h2>
                <div className="space-y-3">
                  {popularArticles.map((article) => (
                    <a
                      key={article}
                      href="#"
                      className="flex items-center gap-3 p-4 rounded-lg hover:bg-sage-pale/30 transition-colors group"
                    >
                      <FileText className="w-5 h-5 text-sage" />
                      <span className="text-gray-body group-hover:text-gray-dark">
                        {article}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-light ml-auto group-hover:text-sage" />
                    </a>
                  ))}
                </div>
              </div>
            </SlideUp>

            {/* FAQs */}
            <SlideUp delay={0.1}>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-dark mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <Card
                      key={faq.question}
                      className="overflow-hidden cursor-pointer"
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-dark">
                            {faq.question}
                          </h3>
                          <ChevronRight
                            className={`w-5 h-5 text-sage transition-transform ${
                              expandedFaq === index ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                        {expandedFaq === index && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-gray-body text-sm mt-3 pt-3 border-t border-sage-pale/50"
                          >
                            {faq.answer}
                          </motion.p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Grief Support Resources */}
      <section className="py-16 bg-rose-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-serif font-bold text-gray-dark mb-4">
                If You&apos;re Struggling
              </h2>
              <p className="text-gray-body max-w-2xl mx-auto">
                Grief is hard. You don&apos;t have to face it alone. These resources
                are available 24/7.
              </p>
            </div>
          </SlideUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full border-rose-200 bg-white">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-2">
                  988 Suicide &amp; Crisis Lifeline
                </h3>
                <p className="text-sm text-gray-body mb-4">
                  Free, confidential support 24/7
                </p>
                <a
                  href="tel:988"
                  className="inline-flex items-center text-rose-600 font-medium text-sm hover:underline"
                >
                  Call or Text 988
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 h-full">
                <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-2">
                  Grief Support Resources
                </h3>
                <p className="text-sm text-gray-body mb-4">
                  Articles, support groups, and professional help
                </p>
                <a
                  href="https://grief.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sage font-medium text-sm hover:underline"
                >
                  Visit grief.com
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 h-full">
                <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-2">
                  GriefShare Groups
                </h3>
                <p className="text-sm text-gray-body mb-4">
                  Find a support group near you
                </p>
                <a
                  href="https://griefshare.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sage font-medium text-sm hover:underline"
                >
                  Find a group
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 h-full">
                <div className="w-12 h-12 rounded-xl bg-sage-pale flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-sage" />
                </div>
                <h3 className="font-semibold text-gray-dark mb-2">
                  Crisis Text Line
                </h3>
                <p className="text-sm text-gray-body mb-4">
                  Free crisis support via text message
                </p>
                <p className="text-sage font-medium text-sm">
                  Text HOME to 741741
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-serif font-bold text-gray-dark mb-4">
                Still Need Help?
              </h2>
              <p className="text-gray-body">
                Our support team is here for you with compassion and care.
              </p>
            </div>
          </SlideUp>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: MessageCircle,
                title: "Live Chat",
                desc: "Chat with our team",
                action: "Start Chat",
                color: "sage",
              },
              {
                icon: Mail,
                title: "Email Support",
                desc: "support@foreverfields.com",
                action: "Send Email",
                color: "gold",
              },
              {
                icon: Phone,
                title: "Phone Support",
                desc: "1-800-FOREVER",
                action: "Call Now",
                color: "coral",
              },
            ].map((option, index) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover:shadow-hover transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    option.color === "sage" ? "bg-sage-pale" :
                    option.color === "gold" ? "bg-gold-pale" :
                    "bg-coral-pale"
                  }`}>
                    <option.icon className={`w-6 h-6 ${
                      option.color === "sage" ? "text-sage-dark" :
                      option.color === "gold" ? "text-gold-dark" :
                      "text-coral-dark"
                    }`} />
                  </div>
                  <h3 className="font-semibold text-gray-dark mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-body mb-4">{option.desc}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    {option.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials CTA */}
      <section className="py-16 bg-gradient-to-r from-coral-pale/40 to-gold-pale/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <Video className="w-12 h-12 text-coral-dark mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-gray-dark mb-4">
              Video Tutorials
            </h2>
            <p className="text-gray-body mb-6">
              Watch step-by-step guides to get the most out of Forever Fields.
            </p>
            <Button size="lg">
              Browse Tutorials
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </SlideUp>
        </div>
      </section>
    </div>
  );
}
