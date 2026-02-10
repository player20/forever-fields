// Individual Shop Order API
// Get and update single order

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Reference to demo orders from parent route
const demoOrders: Map<string, {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    customization?: Record<string, unknown>;
    partnerId?: string;
    partnerStatus?: string;
  }>;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  trackingNumber?: string;
  notes?: string;
  giftMessage?: string;
  isGift: boolean;
  createdAt: string;
  updatedAt: string;
}> = new Map();

// GET /api/shop/orders/[orderId] - Get single order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const { user } = await optionalAuth();

  if (DEMO_MODE) {
    const order = demoOrders.get(orderId);

    // Also check for orders by order number
    if (!order) {
      const byNumber = Array.from(demoOrders.values()).find(
        (o) => o.orderNumber === orderId
      );
      if (byNumber) {
        return NextResponse.json({ order: byNumber });
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    if (order.userId && order.userId !== user?.id && order.userId !== "demo-user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: order, error } = await supabase
      .from("shop_orders")
      .select("*, shop_order_items(*)")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    if (order.user_id && order.user_id !== user.id) {
      // TODO: Check if user is admin
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/shop/orders/[orderId] - Update order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await request.json();

  // Allowed fields for update
  const allowedFields = ["status", "tracking_number", "notes", "shipping_notes"];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (camelField in body) {
      updates[field] = body[camelField];
    } else if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const order = demoOrders.get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = {
      ...order,
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [
          k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
          v,
        ])
      ),
      updatedAt: new Date().toISOString(),
    };

    demoOrders.set(orderId, updated);

    return NextResponse.json({ order: updated });
  }

  try {
    const supabase = await createServerSupabaseClient();

    updates.updated_at = new Date().toISOString();

    const { data: order, error } = await supabase
      .from("shop_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/shop/orders/[orderId] - Cancel order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  if (DEMO_MODE) {
    const order = demoOrders.get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Can only cancel pending/paid orders
    if (!["pending", "paid"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot cancel order in current status" },
        { status: 400 }
      );
    }

    order.status = "cancelled";
    order.updatedAt = new Date().toISOString();
    demoOrders.set(orderId, order);

    return NextResponse.json({ order, cancelled: true });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get order to check status
    const { data: existing } = await supabase
      .from("shop_orders")
      .select("status, user_id")
      .eq("id", orderId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization
    if (existing.user_id !== user.id) {
      // TODO: Check if admin
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can only cancel certain statuses
    if (!["pending", "paid"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Cannot cancel order in current status" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("shop_orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Order cancel error:", error);
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }

    return NextResponse.json({ order, cancelled: true });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
