// Stripe configuration and initialization

import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Stripe public key for client-side
export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "";

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "1 memorial",
      "100MB storage",
      "Basic features",
      "Community support",
    ],
    limits: {
      memorials: 1,
      storage: 100 * 1024 * 1024, // 100MB in bytes
      aiAssistant: false,
      voiceCloning: false,
      cemetery3d: false,
      perpetualStorage: false,
    },
  },
  remember: {
    name: "Remember",
    price: 9,
    priceId: process.env.STRIPE_PRICE_REMEMBER || "price_remember",
    features: [
      "5 memorials",
      "5GB storage",
      "AI Memory Assistant",
      "Photo enhancement",
      "Email support",
    ],
    limits: {
      memorials: 5,
      storage: 5 * 1024 * 1024 * 1024, // 5GB
      aiAssistant: true,
      voiceCloning: false,
      cemetery3d: false,
      perpetualStorage: false,
    },
  },
  heritage: {
    name: "Heritage",
    price: 19,
    priceId: process.env.STRIPE_PRICE_HERITAGE || "price_heritage",
    features: [
      "Unlimited memorials",
      "50GB storage",
      "Voice cloning",
      "3D cemetery view",
      "Animated memories",
      "Priority support",
    ],
    limits: {
      memorials: -1, // unlimited
      storage: 50 * 1024 * 1024 * 1024, // 50GB
      aiAssistant: true,
      voiceCloning: true,
      cemetery3d: true,
      perpetualStorage: false,
    },
  },
  legacy: {
    name: "Legacy",
    price: 49,
    priceId: process.env.STRIPE_PRICE_LEGACY || "price_legacy",
    features: [
      "Family plan (10 users)",
      "200GB shared storage",
      "All premium features",
      "VR cemetery support",
      "Dedicated support",
    ],
    limits: {
      memorials: -1,
      storage: 200 * 1024 * 1024 * 1024, // 200GB
      aiAssistant: true,
      voiceCloning: true,
      cemetery3d: true,
      perpetualStorage: false,
      familyMembers: 10,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// One-time purchase products
export const ONE_TIME_PRODUCTS = {
  perpetual: {
    name: "Perpetual Preservation",
    price: 299,
    priceId: process.env.STRIPE_PRICE_PERPETUAL || "price_perpetual",
    description: "Blockchain preservation for permanent memorial storage",
    features: [
      "IPFS storage",
      "Arweave permanent archive",
      "Memorial never deleted",
      "Verification certificate",
    ],
  },
} as const;

export type OneTimeProduct = keyof typeof ONE_TIME_PRODUCTS;
