// Stripe products management

import { stripe, SUBSCRIPTION_TIERS, ONE_TIME_PRODUCTS } from "./config";
import type { SubscriptionTier, OneTimeProduct } from "./config";

// Get tier by price ID
export function getTierByPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.priceId === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
}

// Get tier configuration
export function getTierConfig(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier];
}

// Get one-time product by price ID
export function getOneTimeProductByPriceId(
  priceId: string
): OneTimeProduct | null {
  for (const [product, config] of Object.entries(ONE_TIME_PRODUCTS)) {
    if (config.priceId === priceId) {
      return product as OneTimeProduct;
    }
  }
  return null;
}

// Check if user can access feature based on tier
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof (typeof SUBSCRIPTION_TIERS)["free"]["limits"]
): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (!tierConfig) return false;

  const limit = tierConfig.limits[feature];
  if (typeof limit === "boolean") return limit;
  if (typeof limit === "number") return limit !== 0;
  return false;
}

// Check memorial limit
export function checkMemorialLimit(
  tier: SubscriptionTier,
  currentCount: number
): { allowed: boolean; limit: number; remaining: number } {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const limit = tierConfig.limits.memorials;

  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
}

// Check storage limit
export function checkStorageLimit(
  tier: SubscriptionTier,
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number; percentage: number } {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const limit = tierConfig.limits.storage;

  return {
    allowed: currentUsage < limit,
    limit,
    remaining: Math.max(0, limit - currentUsage),
    percentage: Math.min(100, Math.round((currentUsage / limit) * 100)),
  };
}

// Get all available subscription prices from Stripe
export async function getSubscriptionPrices() {
  const prices = await stripe.prices.list({
    active: true,
    type: "recurring",
    expand: ["data.product"],
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === "string" ? price.product : price.product.id,
    productName:
      typeof price.product === "string"
        ? "Unknown"
        : (price.product as { name?: string }).name || "Unknown",
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    intervalCount: price.recurring?.interval_count,
  }));
}

// Get product details from Stripe
export async function getProductDetails(productId: string) {
  const product = await stripe.products.retrieve(productId);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    metadata: product.metadata,
    active: product.active,
  };
}

// Format price for display
export function formatPrice(
  amount: number,
  currency: string = "usd"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Format storage for display
export function formatStorage(bytes: number): string {
  if (bytes === -1) return "Unlimited";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Compare tiers (returns positive if tier1 > tier2)
export function compareTiers(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): number {
  const tierOrder: SubscriptionTier[] = [
    "free",
    "remember",
    "heritage",
    "legacy",
  ];
  return tierOrder.indexOf(tier1) - tierOrder.indexOf(tier2);
}

// Get upgrade options for a tier
export function getUpgradeOptions(
  currentTier: SubscriptionTier
): SubscriptionTier[] {
  const tierOrder: SubscriptionTier[] = [
    "free",
    "remember",
    "heritage",
    "legacy",
  ];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder.slice(currentIndex + 1);
}
