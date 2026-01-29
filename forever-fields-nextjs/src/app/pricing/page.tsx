"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { useStripe } from "@/hooks/useStripe";
import { useAuth } from "@/hooks/useAuth";
import { SUBSCRIPTION_TIERS, ONE_TIME_PRODUCTS } from "@/lib/stripe/client-config";
import type { SubscriptionTier } from "@/lib/stripe/client-config";
import {
  Check,
  Flower2,
  Sparkles,
  Crown,
  Users,
  Shield,
  ArrowRight,
  ChevronDown,
  Heart,
} from "lucide-react";

const tierIcons: Record<SubscriptionTier, React.ComponentType<{ className?: string }>> = {
  free: Flower2,
  remember: Sparkles,
  heritage: Crown,
  legacy: Users,
};

const tierColors: Record<SubscriptionTier, string> = {
  free: "border-sage-pale",
  remember: "border-coral-light",
  heritage: "border-gold ring-2 ring-gold/20",
  legacy: "border-twilight",
};

const tierBgColors: Record<SubscriptionTier, string> = {
  free: "bg-sage-pale text-sage",
  remember: "bg-coral-pale text-coral-dark",
  heritage: "bg-gold/10 text-gold",
  legacy: "bg-twilight/10 text-twilight",
};

export default function PricingPage() {
  const { user } = useAuth();
  const { startSubscriptionCheckout, startOneTimeCheckout, isLoading, error } =
    useStripe(user?.id, user?.email, user?.name);

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [showAllPlans, setShowAllPlans] = useState(false);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      // Redirect to signup
      window.location.href = `/signup?plan=${tier}`;
      return;
    }

    await startSubscriptionCheckout(tier, {
      trialDays: tier !== "free" ? 7 : undefined,
    });
  };

  const handlePerpetualPurchase = async () => {
    if (!user) {
      window.location.href = "/signup?product=perpetual";
      return;
    }

    await startOneTimeCheckout("perpetual");
  };

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
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero - Compassionate messaging */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-sage mb-4"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">No pressure, no rush</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-serif font-bold text-gray-dark mb-4"
          >
            Start Free, Upgrade When You&apos;re Ready
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-body max-w-2xl mx-auto mb-4"
          >
            Create a beautiful memorial at no cost. Add more features if and when it feels right.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-gray-muted max-w-xl mx-auto"
          >
            Most families start with Free and find it&apos;s everything they need.
          </motion.p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Simplified 2-option view - reduces decision fatigue */}
        {!showAllPlans ? (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Free Tier - Primary recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="relative p-8 h-full flex flex-col border-sage-pale bg-white">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sage text-white text-xs font-medium px-3 py-1 rounded-full">
                      Recommended to Start
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-sage-pale text-sage">
                      <Flower2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-dark">
                      Free Forever
                    </h3>
                    <p className="text-gray-muted mt-2">Everything you need to get started</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-dark">$0</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>1 beautiful memorial page</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Up to 50 photos</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Invite family to contribute</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Virtual candle lightings</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handleSubscribe("free")}
                    disabled={isLoading}
                    variant="primary"
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <Flower2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Your Memorial"
                    )}
                  </Button>
                </Card>
              </motion.div>

              {/* Heritage Tier - For those who want more */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="relative p-8 h-full flex flex-col border-gray-200 bg-white">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gold/10 text-gold">
                      <Crown className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-dark">
                      Heritage
                    </h3>
                    <p className="text-gray-muted mt-2">When you&apos;re ready for more</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-dark">
                        ${billingPeriod === "annual" ? Math.round(19 * 0.8 * 12) : 19}
                      </span>
                      <span className="text-gray-body">
                        /{billingPeriod === "annual" ? "year" : "month"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-green-600 font-medium">
                      Try free for 7 days
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Up to 5 memorials</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Unlimited photos & stories</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>AI photo restoration</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-body">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>Family tree visualization</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handleSubscribe("heritage")}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <Flower2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Start Free Trial"
                    )}
                  </Button>
                </Card>
              </motion.div>
            </div>

            {/* Billing toggle - subtle */}
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-1 shadow-sm">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-sage text-white"
                      : "text-gray-body hover:text-sage-dark"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "annual"
                      ? "bg-sage text-white"
                      : "text-gray-body hover:text-sage-dark"
                  }`}
                >
                  Annual <span className="text-green-600 text-xs">Save 20%</span>
                </button>
              </div>
            </div>

            {/* Show more options */}
            <div className="text-center">
              <button
                onClick={() => setShowAllPlans(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-muted hover:text-sage-dark transition-colors"
              >
                <span>Compare all plans</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Billing toggle */}
            <div className="flex justify-center mb-12">
              <div className="bg-white rounded-full p-1 shadow-sm">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-sage text-white"
                      : "text-gray-body hover:text-sage-dark"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "annual"
                      ? "bg-sage text-white"
                      : "text-gray-body hover:text-sage-dark"
                  }`}
                >
                  Annual <span className="text-green-600 text-xs">Save 20%</span>
                </button>
              </div>
            </div>

            {/* All pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS.free][]).map(
                ([tier, config], index) => {
                  const Icon = tierIcons[tier];
                  const isPopular = tier === "heritage";
                  const price =
                    billingPeriod === "annual"
                      ? Math.round(config.price * 0.8 * 12)
                      : config.price;

                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`relative p-6 h-full flex flex-col ${tierColors[tier]} ${
                          isPopular ? "shadow-lg scale-105" : ""
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-gold text-white text-xs font-medium px-3 py-1 rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <div
                            className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                              tierBgColors[tier]
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-serif font-bold text-gray-dark">
                            {config.name}
                          </h3>
                          <div className="mt-4">
                            {config.price === 0 ? (
                              <span className="text-3xl font-bold text-gray-dark">
                                Free
                              </span>
                            ) : (
                              <>
                                <span className="text-3xl font-bold text-gray-dark">
                                  ${billingPeriod === "annual" ? price : config.price}
                                </span>
                                <span className="text-gray-body">
                                  /{billingPeriod === "annual" ? "year" : "month"}
                                </span>
                              </>
                            )}
                          </div>
                          {config.price > 0 && (
                            <p className="mt-2 text-xs text-green-600 font-medium bg-green-50 rounded-full px-3 py-1 inline-block">
                              7-day free trial included
                            </p>
                          )}
                        </div>

                        <ul className="space-y-3 mb-6 flex-grow">
                          {config.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-body"
                            >
                              <Check className="w-5 h-5 text-green-500 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSubscribe(tier)}
                          disabled={isLoading}
                          variant={isPopular ? "primary" : "outline"}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Flower2 className="w-4 h-4 animate-spin" />
                          ) : tier === "free" ? (
                            "Get Started"
                          ) : (
                            "Start 7-Day Trial"
                          )}
                        </Button>
                      </Card>
                    </motion.div>
                  );
                }
              )}
            </div>

            {/* Back to simple view */}
            <div className="text-center mb-16">
              <button
                onClick={() => setShowAllPlans(false)}
                className="text-sm text-gray-muted hover:text-sage-dark transition-colors"
              >
                ← Back to simplified view
              </button>
            </div>
          </>
        )}

        {/* Perpetual preservation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-8 border-sage-dark bg-gradient-to-br from-sage-dark to-sage text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-2xl font-serif font-bold mb-2">
                  {ONE_TIME_PRODUCTS.perpetual.name}
                </h3>
                <p className="text-white/80 mb-4">
                  {ONE_TIME_PRODUCTS.perpetual.description}
                </p>
                <ul className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {ONE_TIME_PRODUCTS.perpetual.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-white/90"
                    >
                      <Check className="w-4 h-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center shrink-0">
                <div className="text-3xl font-bold mb-2">
                  ${ONE_TIME_PRODUCTS.perpetual.price}
                </div>
                <div className="text-sm text-white/80 mb-4">One-time</div>
                <Button
                  onClick={handlePerpetualPurchase}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-white text-sage-dark hover:bg-white/90 border-white"
                >
                  {isLoading ? (
                    <Flower2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Purchase <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Family collaboration - softer messaging */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto mt-8"
        >
          <Card className="p-6 bg-sage-pale/20 border-sage-pale/50">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-sage" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-dark mb-1">
                  Better together
                </h3>
                <p className="text-sm text-gray-body">
                  Memorials are most meaningful when family contributes together. Invite loved ones to share their photos and stories.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Reassurance message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="max-w-2xl mx-auto mt-12 text-center"
        >
          <p className="text-gray-muted text-sm">
            Not sure yet? That&apos;s okay. Start with Free and take all the time you need.
            <br />
            You can always upgrade later, and we&apos;ll never rush you.
          </p>
        </motion.div>

        {/* FAQ section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-center text-gray-dark mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-sage">
              <h3 className="font-semibold text-gray-dark mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-body">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately with prorated billing.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-gold">
              <h3 className="font-semibold text-gray-dark mb-2">
                What if I&apos;m not ready to decide?
              </h3>
              <p className="text-gray-body">
                Start with Free. It includes everything you need to create a meaningful memorial.
                There&apos;s no pressure to upgrade, ever. Take all the time you need.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-coral">
              <h3 className="font-semibold text-gray-dark mb-2">
                What happens if I cancel?
              </h3>
              <p className="text-gray-body">
                Your memorials are never deleted. If you cancel a paid plan, you keep
                full access until your billing period ends, then continue on Free.
                Your memories stay safe.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-twilight">
              <h3 className="font-semibold text-gray-dark mb-2">
                What is Perpetual Preservation?
              </h3>
              <p className="text-gray-body">
                It&apos;s our commitment to preserving your memorial permanently. We maintain
                redundant backups across multiple data centers with a 25-year storage guarantee,
                ensuring your memories are protected for generations.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-rose">
              <h3 className="font-semibold text-gray-dark mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-gray-body">
                Yes, we offer a 30-day money-back guarantee on all paid plans.
                Contact us if you&apos;re not satisfied.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
