// Stripe checkout session management

import Stripe from "stripe";
import { stripe, SUBSCRIPTION_TIERS, ONE_TIME_PRODUCTS } from "./config";
import type { SubscriptionTier, OneTimeProduct } from "./config";

// Checkout session types
export type CheckoutMode = "subscription" | "payment";

export interface CheckoutSessionOptions {
  customerId: string;
  priceId: string;
  mode: CheckoutMode;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialDays?: number;
  allowPromotionCodes?: boolean;
  collectBillingAddress?: boolean;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: string;
}

// Create checkout session for subscription
export async function createSubscriptionCheckout(
  customerId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string,
  options?: {
    trialDays?: number;
    allowPromotionCodes?: boolean;
    metadata?: Record<string, string>;
  }
): Promise<CheckoutSession> {
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  if (!tierConfig.priceId) {
    throw new Error(`No price ID configured for tier: ${tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: tierConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: options?.allowPromotionCodes ?? true,
    billing_address_collection: "auto",
    metadata: {
      tier,
      ...options?.metadata,
    },
  };

  if (options?.trialDays) {
    sessionParams.subscription_data = {
      trial_period_days: options.trialDays,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    id: session.id,
    url: session.url || "",
    status: session.status || "unknown",
  };
}

// Create checkout session for one-time purchase
export async function createOneTimeCheckout(
  customerId: string,
  product: OneTimeProduct,
  successUrl: string,
  cancelUrl: string,
  options?: {
    allowPromotionCodes?: boolean;
    metadata?: Record<string, string>;
  }
): Promise<CheckoutSession> {
  const productConfig = ONE_TIME_PRODUCTS[product];

  if (!productConfig.priceId) {
    throw new Error(`No price ID configured for product: ${product}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: productConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: options?.allowPromotionCodes ?? true,
    billing_address_collection: "auto",
    metadata: {
      product,
      ...options?.metadata,
    },
  });

  return {
    id: session.id,
    url: session.url || "",
    status: session.status || "unknown",
  };
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}

// Retrieve checkout session
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "payment_intent", "customer"],
  });
}

// Get checkout session line items
export async function getCheckoutSessionLineItems(
  sessionId: string
): Promise<Stripe.LineItem[]> {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
  return lineItems.data;
}

// Expire checkout session
export async function expireCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.expire(sessionId);
}

// Create setup intent for adding payment method
export async function createSetupIntent(
  customerId: string
): Promise<{
  clientSecret: string;
  id: string;
}> {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });

  return {
    clientSecret: setupIntent.client_secret || "",
    id: setupIntent.id,
  };
}

// List customer payment methods
export async function listPaymentMethods(
  customerId: string
): Promise<
  Array<{
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    isDefault: boolean;
  }>
> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  const customer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethodId =
    typeof customer !== "string" && !customer.deleted
      ? typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id
      : null;

  return paymentMethods.data.map((pm) => ({
    id: pm.id,
    type: pm.type,
    card: pm.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
      : undefined,
    isDefault: pm.id === defaultPaymentMethodId,
  }));
}

// Set default payment method
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// Delete payment method
export async function deletePaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId);
}

// Build success URL with session ID
export function buildSuccessUrl(baseUrl: string, sessionIdParam: string = "session_id"): string {
  return `${baseUrl}?${sessionIdParam}={CHECKOUT_SESSION_ID}`;
}
