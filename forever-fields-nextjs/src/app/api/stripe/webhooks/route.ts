// Stripe webhooks API endpoint

import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  processWebhookEvent,
  getWebhookSecret,
  isEventRecent,
} from "@/lib/stripe";
import type { WebhookHandlers } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import type Stripe from "stripe";

// Disable body parsing for webhooks (need raw body for signature verification)
export const dynamic = "force-dynamic";

// Helper to get user ID from Stripe customer ID
async function getUserByStripeCustomerId(customerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("stripe_customer_id", customerId)
    .single();
  return data;
}

// Helper to update user subscription
async function updateUserSubscription(
  customerId: string,
  updates: {
    subscriptionTier?: string;
    subscriptionStatus?: string;
    subscriptionId?: string | null;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  const supabase = await createServerSupabaseClient();

  // Map tier names to enum values
  const tierMap: Record<string, string> = {
    free: "free",
    remember: "remember",
    heritage: "heritage",
    legacy: "legacy",
  };

  const updateData: Record<string, unknown> = {};
  if (updates.subscriptionTier) {
    updateData.subscription_tier = tierMap[updates.subscriptionTier] || "free";
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Failed to update user subscription:", error);
    throw error;
  }
}

// Helper to create shop order from checkout session
async function createShopOrderFromSession(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  // Only handle shop orders
  if (metadata.type !== "shop_order") {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const orderNumber = `FF-${Date.now().toString().slice(-8)}`;

  // Parse items from metadata
  let items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    customization?: Record<string, unknown>;
  }> = [];

  try {
    items = JSON.parse(metadata.items || "[]");
  } catch {
    console.error("Failed to parse order items from metadata");
    return null;
  }

  // Get shipping details from Stripe
  const shippingDetails = session.shipping_details;
  const customerDetails = session.customer_details;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("shop_orders")
    .insert({
      order_number: orderNumber,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      user_id: metadata.userId || null,
      memorial_id: metadata.memorialId || null,
      customer_email: customerDetails?.email || "",
      customer_name: customerDetails?.name || metadata.customerName || "",
      customer_phone: customerDetails?.phone || null,
      shipping_name: shippingDetails?.name || customerDetails?.name || "",
      shipping_street1: shippingDetails?.address?.line1 || "",
      shipping_street2: shippingDetails?.address?.line2 || null,
      shipping_city: shippingDetails?.address?.city || "",
      shipping_state: shippingDetails?.address?.state || "",
      shipping_postal_code: shippingDetails?.address?.postal_code || "",
      shipping_country: shippingDetails?.address?.country || "US",
      subtotal: parseFloat(metadata.subtotal || "0"),
      shipping_cost: (session.shipping_cost?.amount_total || 0) / 100,
      tax_amount: (session.total_details?.amount_tax || 0) / 100,
      discount_amount: (session.total_details?.amount_discount || 0) / 100,
      total: (session.amount_total || 0) / 100,
      status: "paid",
      paid_at: now,
      is_gift: metadata.isGift === "true",
      gift_message: metadata.giftMessage || null,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Failed to create shop order:", orderError);
    throw orderError;
  }

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.unitPrice * item.quantity,
    customization: item.customization ? JSON.stringify(item.customization) : null,
  }));

  const { error: itemsError } = await supabase
    .from("shop_order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Failed to create order items:", itemsError);
    // Don't throw - order was created, just items failed
  }

  // Send order confirmation email
  if (customerDetails?.email) {
    try {
      await sendEmail({
        to: customerDetails.email,
        template: "order_confirmation",
        data: {
          customerName: customerDetails.name || "Customer",
          orderNumber,
          items: items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
          subtotal: parseFloat(metadata.subtotal || "0"),
          shipping: (session.shipping_cost?.amount_total || 0) / 100,
          tax: (session.total_details?.amount_tax || 0) / 100,
          total: (session.amount_total || 0) / 100,
          shippingAddress: {
            name: shippingDetails?.name || "",
            street1: shippingDetails?.address?.line1 || "",
            street2: shippingDetails?.address?.line2 || "",
            city: shippingDetails?.address?.city || "",
            state: shippingDetails?.address?.state || "",
            postalCode: shippingDetails?.address?.postal_code || "",
            country: shippingDetails?.address?.country || "",
          },
        },
      });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Don't throw - order was created successfully
    }
  }

  return order;
}

// Webhook handlers - implement database operations
const webhookHandlers: WebhookHandlers = {
  onSubscriptionCreated: async (data) => {
    console.log("Subscription created:", {
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      tier: data.tier,
      status: data.status,
    });

    try {
      await updateUserSubscription(data.customerId, {
        subscriptionId: data.subscriptionId,
        subscriptionTier: data.tier,
        subscriptionStatus: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
      });

      // Send welcome email for new subscribers
      const user = await getUserByStripeCustomerId(data.customerId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          template: "welcome",
          data: {
            userName: user.first_name || "there",
            tier: data.tier,
          },
        });
      }
    } catch (error) {
      console.error("Failed to process subscription created:", error);
      throw error;
    }
  },

  onSubscriptionUpdated: async (data) => {
    console.log("Subscription updated:", {
      subscriptionId: data.subscriptionId,
      tier: data.tier,
      status: data.status,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    });

    try {
      await updateUserSubscription(data.customerId, {
        subscriptionTier: data.tier,
        subscriptionStatus: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      });
    } catch (error) {
      console.error("Failed to process subscription updated:", error);
      throw error;
    }
  },

  onSubscriptionDeleted: async (data) => {
    console.log("Subscription deleted:", {
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
    });

    try {
      await updateUserSubscription(data.customerId, {
        subscriptionId: null,
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
      });

      // Notify user of cancellation
      const user = await getUserByStripeCustomerId(data.customerId);
      if (user?.email) {
        // Could send cancellation email here if template exists
        console.log(`Subscription canceled for user ${user.email}`);
      }
    } catch (error) {
      console.error("Failed to process subscription deleted:", error);
      throw error;
    }
  },

  onPaymentSucceeded: async (data) => {
    console.log("Payment succeeded:", {
      invoiceId: data.invoiceId,
      amount: data.amount,
      currency: data.currency,
    });

    // Payment succeeded - subscription should auto-renew
    // Could record payment history here if needed
  },

  onPaymentFailed: async (data) => {
    console.log("Payment failed:", {
      invoiceId: data.invoiceId,
      amount: data.amount,
      customerId: data.customerId,
    });

    try {
      // Notify user of payment failure
      const user = await getUserByStripeCustomerId(data.customerId);
      if (user?.email) {
        // Could send payment failure email here if template exists
        console.log(`Payment failed for user ${user.email}`);
      }
    } catch (error) {
      console.error("Failed to notify payment failure:", error);
      // Don't throw - this is a notification, not critical
    }
  },

  onOneTimePurchase: async (data) => {
    console.log("One-time purchase:", {
      product: data.product,
      amount: data.amount,
      customerId: data.customerId,
    });

    try {
      // Handle perpetual preservation purchase
      if (data.product === "perpetual") {
        const supabase = await createServerSupabaseClient();

        // Enable perpetual storage for user
        const { error } = await supabase
          .from("users")
          .update({ has_perpetual_storage: true })
          .eq("stripe_customer_id", data.customerId);

        if (error) {
          console.error("Failed to enable perpetual storage:", error);
          throw error;
        }

        // Notify user
        const user = await getUserByStripeCustomerId(data.customerId);
        if (user?.email) {
          console.log(`Perpetual storage enabled for user ${user.email}`);
        }
      }
    } catch (error) {
      console.error("Failed to process one-time purchase:", error);
      throw error;
    }
  },

  onCustomerCreated: async (data) => {
    console.log("Customer created:", {
      customerId: data.customerId,
      email: data.email,
    });

    try {
      // Link Stripe customer to user in database
      if (data.email && data.metadata.userId) {
        const supabase = await createServerSupabaseClient();
        await supabase
          .from("users")
          .update({ stripe_customer_id: data.customerId })
          .eq("id", data.metadata.userId);
      }
    } catch (error) {
      console.error("Failed to link customer:", error);
      // Don't throw - not critical
    }
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
    let event: Stripe.Event;
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

    // Handle shop order checkout completion separately
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Check if this is a shop order
      if (session.metadata?.type === "shop_order") {
        try {
          const order = await createShopOrderFromSession(session);
          if (order) {
            console.log("Shop order created:", order.order_number);
          }
          return NextResponse.json({
            received: true,
            event: "checkout.session.completed",
            orderNumber: order?.order_number,
          });
        } catch (error) {
          console.error("Failed to create shop order:", error);
          return NextResponse.json({
            received: true,
            error: "Failed to create order",
          });
        }
      }
    }

    // Process the event with standard handlers
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
