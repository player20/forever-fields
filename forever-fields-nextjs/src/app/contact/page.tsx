"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { FadeIn, SlideUp } from "@/components/motion";
import {
  Flower2,
  Mail,
  MessageSquare,
  HelpCircle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const contactReasons = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing Question" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "press", label: "Press & Media" },
  { value: "feedback", label: "Feedback" },
];

const helpLinks = [
  {
    icon: HelpCircle,
    title: "Help Center",
    description: "Find answers to common questions",
    href: "/help",
  },
  {
    icon: MessageSquare,
    title: "FAQ",
    description: "Quick answers to frequent questions",
    href: "/help#faq",
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "We typically respond within 24 hours",
    href: null,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production, this would send to an API
    console.log("Contact form submitted:", formData);

    setIsSuccess(true);
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="flex items-center justify-center py-24 px-4">
          <FadeIn>
            <Card className="max-w-lg w-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-sage-pale mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-sage" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-twilight mb-4">
                Message Sent!
              </h1>
              <p className="text-gray-body mb-6">
                Thank you for reaching out. We&apos;ll get back to you within 24
                hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/">
                  <Button variant="outline">Return Home</Button>
                </Link>
                <Link href="/help">
                  <Button>Visit Help Center</Button>
                </Link>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-sage-pale/30 to-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
              <Mail className="w-4 h-4 text-sage" />
              <span className="text-sm font-medium text-gray-dark">
                Get in Touch
              </span>
            </div>
          </FadeIn>

          <SlideUp delay={0.1}>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-4">
              Contact Us
            </h1>
          </SlideUp>

          <SlideUp delay={0.2}>
            <p className="text-gray-body max-w-xl mx-auto">
              Have a question or need help? We&apos;re here to support you. Send
              us a message and we&apos;ll respond as soon as possible.
            </p>
          </SlideUp>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <FadeIn>
                <Card className="p-6 sm:p-8">
                  <h2 className="text-xl font-serif font-bold text-twilight mb-6">
                    Send a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-dark mb-2"
                      >
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                        placeholder="John Smith"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-dark mb-2"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label
                        htmlFor="reason"
                        className="block text-sm font-medium text-gray-dark mb-2"
                      >
                        What can we help with?
                      </label>
                      <select
                        id="reason"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors bg-white"
                      >
                        {contactReasons.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-dark mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors resize-none"
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-4 bg-rose/10 border border-rose/20 rounded-lg text-rose text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              </FadeIn>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SlideUp delay={0.2}>
                <Card className="p-6">
                  <h3 className="text-lg font-serif font-bold text-twilight mb-4">
                    Quick Help
                  </h3>
                  <div className="space-y-4">
                    {helpLinks.map((link) => (
                      <div key={link.title}>
                        {link.href ? (
                          <Link
                            href={link.href}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-sage-pale/30 transition-colors"
                          >
                            <link.icon className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-dark">
                                {link.title}
                              </p>
                              <p className="text-sm text-gray-body">
                                {link.description}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-start gap-3 p-3">
                            <link.icon className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-dark">
                                {link.title}
                              </p>
                              <p className="text-sm text-gray-body">
                                {link.description}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </SlideUp>

              <SlideUp delay={0.3}>
                <Card className="p-6 bg-gradient-to-br from-sage-pale/30 to-cream">
                  <h3 className="text-lg font-serif font-bold text-twilight mb-3">
                    Email Us Directly
                  </h3>
                  <p className="text-gray-body text-sm mb-3">
                    Prefer email? Reach out to us at:
                  </p>
                  <a
                    href="mailto:support@foreverfields.com"
                    className="text-sage font-medium hover:underline"
                  >
                    support@foreverfields.com
                  </a>
                </Card>
              </SlideUp>

              <SlideUp delay={0.4}>
                <Card className="p-6">
                  <h3 className="text-lg font-serif font-bold text-twilight mb-3">
                    Cemetery Partnerships
                  </h3>
                  <p className="text-gray-body text-sm mb-4">
                    Interested in partnering with Forever Fields for your
                    cemetery?
                  </p>
                  <Link href="/partners">
                    <Button variant="outline" size="sm" className="w-full">
                      Learn About Partnerships
                    </Button>
                  </Link>
                </Card>
              </SlideUp>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-twilight text-white/70 py-8 mt-12">
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
