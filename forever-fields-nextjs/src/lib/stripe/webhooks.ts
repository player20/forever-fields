// Stripe webhook event handling

import Stripe from "stripe";
import { stripe } from "./config";
import { getTierByPriceId, getOneTimeProductByPriceId } from "./products";
import type { SubscriptionTier, OneTimeProduct } from "./config";

// Webhook event types we handle
export type WebhookEventType =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "customer.created"
  | "customer.updated"
  | "payment_intent.succeeded";

// Webhook handler result
export interface WebhookResult {
  success: boolean;
  event: WebhookEventType;
  data?: unknown;
  error?: string;
}

// Event handlers type
export type WebhookHandlers = {
  onSubscriptionCreated?: (data: SubscriptionEventData) => Promise<void>;
  onSubscriptionUpdated?: (data: SubscriptionEventData) => Promise<void>;
  onSubscriptionDeleted?: (data: SubscriptionEventData) => Promise<void>;
  onPaymentSucceeded?: (data: PaymentEventData) => Promise<void>;
  onPaymentFailed?: (data: PaymentEventData) => Promise<void>;
  onOneTimePurchase?: (data: OneTimePurchaseData) => Promise<void>;
  onCustomerCreated?: (data: CustomerEventData) => Promise<void>;
};

// Event data types
export interface SubscriptionEventData {
  subscriptionId: string;
  customerId: string;
  status: string;
  tier: SubscriptionTier;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, string>;
}

export interface PaymentEventData {
  invoiceId: string;
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: string;
}

export interface OneTimePurchaseData {
  sessionId: string;
  customerId: string;
  product: OneTimeProduct;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

export interface CustomerEventData {
  customerId: string;
  email: string | null;
  name: string | null;
  metadata: Record<string, string>;
}

// Verify webhook signature and construct event
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Process webhook event
export async function processWebhookEvent(
  event: Stripe.Event,
  handlers: WebhookHandlers
): Promise<WebhookResult> {
  const eventType = event.type as WebhookEventType;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // One-time purchase
          const product = getOneTimeProductByPriceId(
            session.metadata?.priceId || ""
          );

          if (product && handlers.onOneTimePurchase) {
            await handlers.onOneTimePurchase({
              sessionId: session.id,
              customerId: session.customer as string,
              product,
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              metadata: (session.metadata || {}) as Record<string, string>,
            });
          }
        }
        break;
      }

      case "customer.subscription.created": {
        // Cast to extended type to access period properties
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const priceId = subscription.items.data[0]?.price.id;
        const tier = getTierByPriceId(priceId || "") || "free";

        if (handlers.onSubscriptionCreated) {
          await handlers.onSubscriptionCreated({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: subscription.status,
            tier,
            priceId: priceId || "",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            metadata: (subscription.metadata || {}) as Record<string, string>,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        // Cast to extended type to access period properties
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const priceId = subscription.items.data[0]?.price.id;
        const tier = getTierByPriceId(priceId || "") || "free";

        if (handlers.onSubscriptionUpdated) {
          await handlers.onSubscriptionUpdated({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: subscription.status,
            tier,
            priceId: priceId || "",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            metadata: (subscription.metadata || {}) as Record<string, string>,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Cast to extended type to access period properties
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        const priceId = subscription.items.data[0]?.price.id;
        const tier = getTierByPriceId(priceId || "") || "free";

        if (handlers.onSubscriptionDeleted) {
          await handlers.onSubscriptionDeleted({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: subscription.status,
            tier,
            priceId: priceId || "",
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            metadata: (subscription.metadata || {}) as Record<string, string>,
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Cast to extended type to access subscription and amount properties
        const invoice = event.data.object as Stripe.Invoice & {
          subscription: string | null;
          amount_paid: number;
        };

        if (handlers.onPaymentSucceeded) {
          await handlers.onPaymentSucceeded({
            invoiceId: invoice.id,
            customerId: invoice.customer as string,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status || "unknown",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        // Cast to extended type to access subscription property
        const invoice = event.data.object as Stripe.Invoice & {
          subscription: string | null;
        };

        if (handlers.onPaymentFailed) {
          await handlers.onPaymentFailed({
            invoiceId: invoice.id,
            customerId: invoice.customer as string,
            subscriptionId: invoice.subscription as string | null,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: invoice.status || "unknown",
          });
        }
        break;
      }

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;

        if (handlers.onCustomerCreated) {
          await handlers.onCustomerCreated({
            customerId: customer.id,
            email: customer.email,
            name: customer.name ?? null,
            metadata: (customer.metadata || {}) as Record<string, string>,
          });
        }
        break;
      }

      default:
        // Unhandled event type
        return {
          success: true,
          event: eventType,
          data: { message: "Event type not handled" },
        };
    }

    return {
      success: true,
      event: eventType,
    };
  } catch (error) {
    return {
      success: false,
      event: eventType,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get webhook signing secret
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

// Verify event is recent (within 5 minutes)
export function isEventRecent(event: Stripe.Event, toleranceMinutes: number = 5): boolean {
  const eventTime = event.created * 1000;
  const now = Date.now();
  const tolerance = toleranceMinutes * 60 * 1000;
  return now - eventTime < tolerance;
}
