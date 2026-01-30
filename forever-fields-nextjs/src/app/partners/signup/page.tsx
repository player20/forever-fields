"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { FadeIn, SlideUp } from "@/components/motion";
import {
  Flower2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface FormData {
  cemeteryName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  estimatedPlots: string;
  message: string;
}

const initialFormData: FormData = {
  cemeteryName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "United States",
  website: "",
  estimatedPlots: "",
  message: "",
};

const plotRanges = [
  "Less than 500",
  "500 - 1,000",
  "1,000 - 5,000",
  "5,000 - 10,000",
  "10,000+",
];

export default function PartnerSignupPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
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

    try {
      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <FadeIn>
          <Card className="max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-sage-pale mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-sage" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-twilight mb-4">
              Thank You for Registering!
            </h1>
            <p className="text-gray-body mb-6">
              We&apos;ve received your registration for{" "}
              <span className="font-medium text-gray-dark">
                {formData.cemeteryName}
              </span>
              . Our team will reach out within 1-2 business days to help you get
              started.
            </p>
            <div className="bg-sage-pale/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-dark">
                <strong>What&apos;s next?</strong>
              </p>
              <ul className="text-sm text-gray-body mt-2 space-y-1">
                <li>• Check your email for confirmation</li>
                <li>• We&apos;ll set up your Heritage Portal</li>
                <li>• You&apos;ll receive your first batch of QR codes</li>
              </ul>
            </div>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-sage-pale/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <Flower2 className="w-8 h-8 text-sage" />
              <span className="text-xl font-serif font-bold text-sage-dark">
                Forever Fields
              </span>
            </Link>
            <Link href="/partners">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Partners
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SlideUp>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-pale/50 rounded-full mb-4">
                <Building2 className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-sage-dark">
                  Cemetery Registration
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-twilight mb-3">
                Register Your Cemetery
              </h1>
              <p className="text-gray-body">
                Fill out this form and we&apos;ll have you set up within 48 hours.
                It&apos;s completely free.
              </p>
            </div>
          </SlideUp>

          <FadeIn delay={0.2}>
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cemetery Name */}
                <div>
                  <label
                    htmlFor="cemeteryName"
                    className="block text-sm font-medium text-gray-dark mb-2"
                  >
                    Cemetery Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                    <input
                      type="text"
                      id="cemeteryName"
                      name="cemeteryName"
                      value={formData.cemeteryName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="Oak Hill Memorial Gardens"
                    />
                  </div>
                </div>

                {/* Contact Name and Email - Two columns */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contactName"
                      className="block text-sm font-medium text-gray-dark mb-2"
                    >
                      Contact Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                      <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-dark mb-2"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                        placeholder="john@cemetery.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-dark mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-dark mb-2"
                  >
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="1234 Memorial Drive"
                    />
                  </div>
                </div>

                {/* City, State, Country */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-dark mb-2"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="Springfield"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-dark mb-2"
                    >
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="IL"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-dark mb-2"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="United States"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-dark mb-2"
                  >
                    Website (optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-light" />
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
                      placeholder="https://www.yourcemetery.com"
                    />
                  </div>
                </div>

                {/* Estimated Plots */}
                <div>
                  <label
                    htmlFor="estimatedPlots"
                    className="block text-sm font-medium text-gray-dark mb-2"
                  >
                    Approximate Number of Plots
                  </label>
                  <select
                    id="estimatedPlots"
                    name="estimatedPlots"
                    value={formData.estimatedPlots}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors bg-white"
                  >
                    <option value="">Select a range</option>
                    {plotRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
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
                    Anything else we should know?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-sage focus:border-sage transition-colors resize-none"
                    placeholder="Tell us about your cemetery, any specific needs, or questions you have..."
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-rose/10 border border-rose/20 rounded-lg text-rose text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Register Cemetery"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-body">
                  By registering, you agree to our{" "}
                  <Link href="/terms" className="text-sage hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-sage hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </Card>
          </FadeIn>

          {/* FAQ Link */}
          <div className="text-center mt-8">
            <p className="text-gray-body">
              Have questions?{" "}
              <Link href="/partners#faq" className="text-sage hover:underline">
                Read our FAQ
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-sage hover:underline">
                contact us directly
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
