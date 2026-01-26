// Stripe webhooks API endpoint

import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  processWebhookEvent,
  getWebhookSecret,
  isEventRecent,
} from "@/lib/stripe";
import type { WebhookHandlers } from "@/lib/stripe";

// Disable body parsing for webhooks (need raw body for signature verification)
export const dynamic = "force-dynamic";

// Webhook handlers - customize these to update your database
const webhookHandlers: WebhookHandlers = {
  onSubscriptionCreated: async (data) => {
    console.log("Subscription created:", {
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      tier: data.tier,
      status: data.status,
    });

    // TODO: Update user subscription in database
    // await db.users.update({
    //   where: { stripeCustomerId: data.customerId },
    //   data: {
    //     subscriptionId: data.subscriptionId,
    //     subscriptionTier: data.tier,
    //     subscriptionStatus: data.status,
    //     currentPeriodEnd: data.currentPeriodEnd,
    //   },
    // });
  },

  onSubscriptionUpdated: async (data) => {
    console.log("Subscription updated:", {
      subscriptionId: data.subscriptionId,
      tier: data.tier,
      status: data.status,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    });

    // TODO: Update user subscription in database
    // await db.users.update({
    //   where: { stripeCustomerId: data.customerId },
    //   data: {
    //     subscriptionTier: data.tier,
    //     subscriptionStatus: data.status,
    //     currentPeriodEnd: data.currentPeriodEnd,
    //     cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    //   },
    // });
  },

  onSubscriptionDeleted: async (data) => {
    console.log("Subscription deleted:", {
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
    });

    // TODO: Downgrade user to free tier
    // await db.users.update({
    //   where: { stripeCustomerId: data.customerId },
    //   data: {
    //     subscriptionId: null,
    //     subscriptionTier: "free",
    //     subscriptionStatus: "canceled",
    //   },
    // });
  },

  onPaymentSucceeded: async (data) => {
    console.log("Payment succeeded:", {
      invoiceId: data.invoiceId,
      amount: data.amount,
      currency: data.currency,
    });

    // TODO: Record payment in database, send receipt email
  },

  onPaymentFailed: async (data) => {
    console.log("Payment failed:", {
      invoiceId: data.invoiceId,
      amount: data.amount,
      customerId: data.customerId,
    });

    // TODO: Send payment failure notification, update subscription status
  },

  onOneTimePurchase: async (data) => {
    console.log("One-time purchase:", {
      product: data.product,
      amount: data.amount,
      customerId: data.customerId,
    });

    // Handle perpetual preservation purchase
    if (data.product === "perpetual") {
      // TODO: Enable perpetual storage for user's memorials
      // await db.users.update({
      //   where: { stripeCustomerId: data.customerId },
      //   data: { hasPerpetualStorage: true },
      // });
    }
  },

  onCustomerCreated: async (data) => {
    console.log("Customer created:", {
      customerId: data.customerId,
      email: data.email,
    });

    // TODO: Link Stripe customer to user in database
  },
};

// POST /api/stripe/webhooks - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = await constructWebhookEvent(body, signature, getWebhookSecret());
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Check if event is recent (replay protection)
    if (!isEventRecent(event)) {
      console.warn("Received old webhook event:", event.id);
      // Still process it but log warning
    }

    // Process the event
    const result = await processWebhookEvent(event, webhookHandlers);

    if (!result.success) {
      console.error("Webhook processing failed:", result.error);
      // Return 200 to prevent Stripe from retrying (we logged the error)
      return NextResponse.json({
        received: true,
        error: result.error,
      });
    }

    return NextResponse.json({
      received: true,
      event: result.event,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
