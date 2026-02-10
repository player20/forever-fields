// Order Routing Service
// Sends orders to fulfillment partners via webhooks, Shopify API, or email

import crypto from "crypto";

// Types
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  customization?: Record<string, unknown>;
}

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface OrderPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  total: number;
  notes?: string;
  giftMessage?: string;
  isGift: boolean;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string;
  webhookUrl?: string;
  webhookSecret?: string;
  shopifyStoreUrl?: string;
  shopifyAccessToken?: string;
  contactEmail: string;
}

interface RouteResult {
  success: boolean;
  partnerOrderId?: string;
  error?: string;
}

// Generate webhook signature for verification
function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

// Send order via webhook
async function sendViaWebhook(
  partner: Partner,
  order: OrderPayload
): Promise<RouteResult> {
  if (!partner.webhookUrl) {
    return { success: false, error: "No webhook URL configured" };
  }

  const payload = JSON.stringify({
    event: "order.created",
    timestamp: new Date().toISOString(),
    data: order,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Forever-Fields-Event": "order.created",
    "X-Forever-Fields-Order-ID": order.orderId,
  };

  // Add signature if secret is configured
  if (partner.webhookSecret) {
    headers["X-Forever-Fields-Signature"] = generateWebhookSignature(
      payload,
      partner.webhookSecret
    );
  }

  try {
    const response = await fetch(partner.webhookUrl, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Webhook failed with status ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      partnerOrderId: result.orderId || result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook request failed",
    };
  }
}

// Send order via Shopify Draft Order API
async function sendViaShopify(
  partner: Partner,
  order: OrderPayload
): Promise<RouteResult> {
  if (!partner.shopifyStoreUrl || !partner.shopifyAccessToken) {
    return { success: false, error: "Shopify credentials not configured" };
  }

  const shopifyUrl = `https://${partner.shopifyStoreUrl}/admin/api/2024-01/draft_orders.json`;

  // Map items to Shopify line items
  const lineItems = order.items.map((item) => ({
    title: item.productName,
    quantity: item.quantity,
    price: item.unitPrice.toFixed(2),
    properties: item.customization
      ? Object.entries(item.customization).map(([name, value]) => ({
          name,
          value: String(value),
        }))
      : [],
  }));

  const draftOrder = {
    draft_order: {
      line_items: lineItems,
      shipping_address: {
        first_name: order.shippingAddress.name.split(" ")[0],
        last_name: order.shippingAddress.name.split(" ").slice(1).join(" ") || "",
        address1: order.shippingAddress.street1,
        address2: order.shippingAddress.street2,
        city: order.shippingAddress.city,
        province: order.shippingAddress.state,
        zip: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
      email: order.customerEmail,
      note: order.notes,
      tags: `forever-fields,ff-order-${order.orderNumber}`,
      use_customer_default_address: false,
    },
  };

  try {
    const response = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": partner.shopifyAccessToken,
      },
      body: JSON.stringify(draftOrder),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Shopify API error: ${JSON.stringify(error)}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      partnerOrderId: String(result.draft_order.id),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Shopify API request failed",
    };
  }
}

// Send order via email (fallback)
async function sendViaEmail(
  partner: Partner,
  order: OrderPayload
): Promise<RouteResult> {
  // In production, this would use a service like SendGrid, Resend, etc.
  // For now, we'll just log and return success

  console.log(`[OrderRouting] Sending order ${order.orderNumber} to ${partner.contactEmail}`);

  const emailBody = `
New Order from Forever Fields

Order Number: ${order.orderNumber}
Customer: ${order.customerName} (${order.customerEmail})

Items:
${order.items.map((item) => `- ${item.productName} x${item.quantity} @ $${item.unitPrice}`).join("\n")}

Shipping Address:
${order.shippingAddress.name}
${order.shippingAddress.street1}
${order.shippingAddress.street2 || ""}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
${order.shippingAddress.country}

${order.notes ? `Notes: ${order.notes}` : ""}
${order.isGift ? `Gift Message: ${order.giftMessage || "N/A"}` : ""}

Total: $${order.total.toFixed(2)}

Please fulfill this order and update the tracking information.
  `.trim();

  // TODO: Implement actual email sending
  console.log("[OrderRouting] Email content:", emailBody);

  return {
    success: true,
    partnerOrderId: `email-${Date.now()}`,
  };
}

// Main routing function
export async function routeOrderToPartner(
  partner: Partner,
  order: OrderPayload
): Promise<RouteResult> {
  console.log(`[OrderRouting] Routing order ${order.orderNumber} to partner ${partner.name}`);

  // Try Shopify first if configured
  if (partner.shopifyStoreUrl && partner.shopifyAccessToken) {
    const result = await sendViaShopify(partner, order);
    if (result.success) return result;
    console.warn(`[OrderRouting] Shopify failed, trying webhook: ${result.error}`);
  }

  // Try webhook
  if (partner.webhookUrl) {
    const result = await sendViaWebhook(partner, order);
    if (result.success) return result;
    console.warn(`[OrderRouting] Webhook failed, trying email: ${result.error}`);
  }

  // Fall back to email
  return sendViaEmail(partner, order);
}

// Batch route items to multiple partners
export async function routeOrderItems(
  order: OrderPayload,
  itemsByPartner: Map<Partner, OrderItem[]>
): Promise<Map<string, RouteResult>> {
  const results = new Map<string, RouteResult>();

  for (const [partner, items] of Array.from(itemsByPartner.entries())) {
    const partnerOrder = {
      ...order,
      items,
      subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    };

    const result = await routeOrderToPartner(partner, partnerOrder);
    results.set(partner.id, result);
  }

  return results;
}

// Verify incoming webhook from partner
export function verifyPartnerWebhook(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
