// Stripe shop checkout API endpoint
// Creates checkout sessions for shop product purchases

import { NextRequest, NextResponse } from "next/server";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";
import { optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import type { ShopCartItem } from "@/hooks/useShopCart";

interface ShopCheckoutRequest {
  items: ShopCartItem[];
  shippingAddress?: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerEmail?: string;
  customerName?: string;
  isGift?: boolean;
  giftMessage?: string;
  memorialId?: string;
}

// POST /api/stripe/shop-checkout - Create shop checkout session
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShopCheckoutRequest;
    const { items, shippingAddress, customerEmail, customerName, isGift, giftMessage, memorialId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Build URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/shop/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/shop?view=cart`;

    // Demo mode - return fake session
    if (DEMO_MODE) {
      const fakeSessionId = `cs_demo_${Date.now()}`;
      return NextResponse.json({
        sessionId: fakeSessionId,
        url: `${origin}/shop/order-confirmation?session_id=${fakeSessionId}&demo=true`,
      });
    }

    // Get authenticated user if available
    const { user } = await optionalAuth();

    // Get or create Stripe customer
    let customerId: string | undefined;
    if (user) {
      customerId = await getOrCreateCustomer(
        user.id,
        user.email!,
        user.user_metadata?.full_name || user.user_metadata?.first_name
      );
    }

    // Build line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          metadata: {
            productId: item.product.id,
            customization: item.customization ? JSON.stringify(item.customization) : "",
          },
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Calculate totals for metadata
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // Build metadata for webhook
    const metadata: Record<string, string> = {
      type: "shop_order",
      items: JSON.stringify(
        items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          customization: item.customization,
        }))
      ),
      subtotal: subtotal.toString(),
      isGift: isGift ? "true" : "false",
    };

    if (user?.id) metadata.userId = user.id;
    if (memorialId) metadata.memorialId = memorialId;
    if (giftMessage) metadata.giftMessage = giftMessage;
    if (shippingAddress) metadata.shippingAddress = JSON.stringify(shippingAddress);
    if (customerName) metadata.customerName = customerName;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_email: !customerId ? (customerEmail || user?.email) : undefined,
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 999, currency: "usd" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Shop checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
