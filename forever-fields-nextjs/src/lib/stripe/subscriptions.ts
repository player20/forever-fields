// Stripe subscription management

import Stripe from "stripe";
import { stripe } from "./config";
import type { SubscriptionTier } from "./config";
import { getTierByPriceId } from "./products";

// Subscription status type
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "unpaid"
  | "paused";

// User subscription info
export interface UserSubscription {
  id: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
}

// Create or get Stripe customer for user
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer by metadata
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update metadata if needed
    if (customer.metadata?.userId !== userId) {
      await stripe.customers.update(customer.id, {
        metadata: { userId },
      });
    }

    return customer.id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return customer.id;
}

// Get customer's active subscription
export async function getActiveSubscription(
  customerId: string
): Promise<UserSubscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
    expand: ["data.items.data.price"],
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  const subscription = subscriptions.data[0];
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierByPriceId(priceId || "") || "free";

  // Use type assertion for properties that may vary by API version
  const sub = subscription as unknown as {
    id: string;
    status: string;
    current_period_start?: number;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
    canceled_at?: number | null;
    trial_end?: number | null;
  };

  return {
    id: sub.id,
    status: sub.status as SubscriptionStatus,
    tier,
    currentPeriodStart: new Date((sub.current_period_start || 0) * 1000),
    currentPeriodEnd: new Date((sub.current_period_end || 0) * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    canceledAt: sub.canceled_at
      ? new Date(sub.canceled_at * 1000)
      : null,
    trialEnd: sub.trial_end
      ? new Date(sub.trial_end * 1000)
      : null,
  };
}

// Create subscription
export async function createSubscription(
  customerId: string,
  priceId: string,
  options?: {
    trialDays?: number;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: options?.metadata,
  };

  if (options?.trialDays) {
    subscriptionData.trial_period_days = options.trialDays;
  }

  if (options?.paymentMethodId) {
    subscriptionData.default_payment_method = options.paymentMethodId;
  }

  return stripe.subscriptions.create(subscriptionData);
}

// Update subscription (change plan)
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItemId = subscription.items.data[0]?.id;

  if (!currentItemId) {
    throw new Error("Subscription has no items");
  }

  // Update to new price
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItemId,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

// Cancel subscription (at period end)
export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<Stripe.Subscription> {
  if (immediate) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Reactivate canceled subscription
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Pause subscription
export async function pauseSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: "mark_uncollectible",
    },
  });
}

// Resume paused subscription
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: "",
  });
}

// Get subscription invoices
export async function getSubscriptionInvoices(
  customerId: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    number: string | null;
    status: string | null;
    amount: number;
    currency: string;
    date: Date;
    pdfUrl: string | null;
  }>
> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    date: new Date((invoice.created || 0) * 1000),
    pdfUrl: invoice.invoice_pdf ?? null,
  }));
}

// Get upcoming invoice (preview)
export async function getUpcomingInvoice(
  customerId: string,
  newPriceId?: string
): Promise<{
  amount: number;
  currency: string;
  date: Date;
  lines: Array<{
    description: string | null;
    amount: number;
  }>;
} | null> {
  // TODO: Implement with correct Stripe SDK method (API changed in newer versions)
  // For now, return null - this feature can be enabled when Stripe types are updated
  console.log('getUpcomingInvoice called for', customerId, newPriceId);
  return null;
}

// Check if subscription is active
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return ["active", "trialing"].includes(status);
}

// Get days until subscription ends
export function getDaysUntilEnd(subscription: UserSubscription): number {
  const now = new Date();
  const end = subscription.currentPeriodEnd;
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format subscription status for display
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  const statusMap: Record<SubscriptionStatus, string> = {
    active: "Active",
    past_due: "Past Due",
    canceled: "Canceled",
    incomplete: "Incomplete",
    incomplete_expired: "Expired",
    trialing: "Trial",
    unpaid: "Unpaid",
    paused: "Paused",
  };
  return statusMap[status] || status;
}
