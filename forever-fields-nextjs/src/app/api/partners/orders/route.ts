// Partner Orders API
// View and manage orders assigned to a partner

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Demo partner orders
const demoPartnerOrders: Array<{
  id: string;
  orderId: string;
  orderNumber: string;
  partnerId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  customization?: Record<string, unknown>;
  status: string;
  trackingNumber?: string;
  customerName: string;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: "po-1",
    orderId: "order-1",
    orderNumber: "FF-12345678",
    partnerId: "partner-1",
    productId: "1",
    productName: "Memorial Flower Arrangement",
    quantity: 1,
    unitPrice: 75,
    status: "shipped",
    trackingNumber: "1Z999AA10123456784",
    customerName: "John Smith",
    shippingAddress: {
      name: "John Smith",
      street1: "123 Main St",
      city: "Seattle",
      state: "WA",
      postalCode: "98101",
      country: "US",
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "po-2",
    orderId: "order-3",
    orderNumber: "FF-12345680",
    partnerId: "partner-1",
    productId: "1",
    productName: "Memorial Flower Arrangement",
    quantity: 2,
    unitPrice: 75,
    status: "pending",
    customerName: "Mary Johnson",
    shippingAddress: {
      name: "Mary Johnson",
      street1: "789 Pine St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "US",
    },
    notes: "Please deliver before 2pm",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "po-3",
    orderId: "order-2",
    orderNumber: "FF-12345679",
    partnerId: "partner-2",
    productId: "2",
    productName: "Personalized Memorial Stone",
    quantity: 1,
    unitPrice: 149,
    customization: { engraving: "In Loving Memory of Mom" },
    status: "processing",
    customerName: "Jane Doe",
    shippingAddress: {
      name: "Jane Doe",
      street1: "456 Oak Ave",
      street2: "Apt 2B",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "US",
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to get partner ID from auth header
function getPartnerId(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  const partnerId = request.headers.get("X-Partner-ID");

  if (partnerId) return partnerId;

  // For demo, extract from token or use default
  if (authHeader?.includes("ff_session_")) {
    return "partner-1"; // Default demo partner
  }

  return null;
}

// GET /api/partners/orders - List orders for partner
export async function GET(request: NextRequest) {
  const partnerId = getPartnerId(request);

  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (DEMO_MODE) {
    let orders = demoPartnerOrders.filter((o) => o.partnerId === partnerId);

    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Sort by date descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = orders.length;
    orders = orders.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      pending: demoPartnerOrders.filter((o) => o.partnerId === partnerId && o.status === "pending").length,
      processing: demoPartnerOrders.filter((o) => o.partnerId === partnerId && o.status === "processing").length,
      shipped: demoPartnerOrders.filter((o) => o.partnerId === partnerId && o.status === "shipped").length,
      delivered: demoPartnerOrders.filter((o) => o.partnerId === partnerId && o.status === "delivered").length,
    };

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
      stats,
    });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("shop_order_items")
      .select(`
        *,
        order:shop_orders(
          id,
          order_number,
          customer_email,
          customer_name,
          shipping_name,
          shipping_street1,
          shipping_street2,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          shipping_country,
          notes,
          created_at
        )
      `)
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("partner_status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("Error fetching partner orders:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Partner orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/partners/orders - Update order item status
export async function PATCH(request: NextRequest) {
  const partnerId = getPartnerId(request);

  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderItemId, status, trackingNumber, notes } = body;

    if (!orderItemId) {
      return NextResponse.json({ error: "Order item ID required" }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (DEMO_MODE) {
      const orderIndex = demoPartnerOrders.findIndex(
        (o) => o.id === orderItemId && o.partnerId === partnerId
      );

      if (orderIndex === -1) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const order = demoPartnerOrders[orderIndex];
      if (status) order.status = status;
      if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
      if (notes !== undefined) order.notes = notes;
      order.updatedAt = new Date().toISOString();

      return NextResponse.json({ order });
    }

    const supabase = await createServerSupabaseClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.partner_status = status;
    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (notes !== undefined) updates.partner_notes = notes;

    const { data: order, error } = await supabase
      .from("shop_order_items")
      .update(updates)
      .eq("id", orderItemId)
      .eq("partner_id", partnerId)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Partner order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
