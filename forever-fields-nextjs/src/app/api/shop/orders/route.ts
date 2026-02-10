// Shop Orders API
// List, create, and manage shop orders

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth, optionalAuth } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";
import { routeOrderToPartner } from "@/lib/shop/order-routing";

// Demo orders store
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

// Initialize with demo orders
if (demoOrders.size === 0) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const sampleOrders = [
    {
      id: "order-1",
      orderNumber: "FF-12345678",
      userId: "demo-user",
      customerEmail: "john@example.com",
      customerName: "John Smith",
      items: [
        {
          productId: "1",
          productName: "Memorial Flower Arrangement",
          quantity: 1,
          unitPrice: 75,
          partnerId: "partner-1",
          partnerStatus: "shipped",
        },
      ],
      shippingAddress: {
        name: "John Smith",
        street1: "123 Main St",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "US",
      },
      subtotal: 75,
      shippingCost: 9.99,
      total: 84.99,
      status: "shipped",
      trackingNumber: "1Z999AA10123456784",
      isGift: false,
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "order-2",
      orderNumber: "FF-12345679",
      userId: "demo-user",
      customerEmail: "jane@example.com",
      customerName: "Jane Doe",
      items: [
        {
          productId: "2",
          productName: "Personalized Memorial Stone",
          quantity: 1,
          unitPrice: 149,
          partnerId: "partner-2",
          partnerStatus: "processing",
          customization: { engraving: "In Loving Memory" },
        },
        {
          productId: "3",
          productName: "Memory Candle Set",
          quantity: 2,
          unitPrice: 45,
        },
      ],
      shippingAddress: {
        name: "Jane Doe",
        street1: "456 Oak Ave",
        street2: "Apt 2B",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        country: "US",
      },
      subtotal: 239,
      shippingCost: 0,
      total: 239,
      status: "processing",
      isGift: true,
      giftMessage: "Thinking of you during this difficult time.",
      createdAt: lastWeek.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];

  sampleOrders.forEach((order) => demoOrders.set(order.id, order));
}

// GET /api/shop/orders - List orders
export async function GET(request: NextRequest) {
  const { user } = await optionalAuth();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (DEMO_MODE) {
    let orders = Array.from(demoOrders.values());

    // Filter by user if not admin
    if (user?.id) {
      orders = orders.filter((o) => o.userId === user.id || o.userId === "demo-user");
    }

    // Filter by status
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Sort by date descending
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const total = orders.length;
    orders = orders.slice(offset, offset + limit);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
    });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("shop_orders")
      .select("*, shop_order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/shop/orders - Create order (webhook handler)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stripeSessionId,
      customerEmail,
      customerName,
      items,
      shippingAddress,
      subtotal,
      shippingCost,
      total,
      userId,
      isGift,
      giftMessage,
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const orderNumber = `FF-${Date.now().toString().slice(-8)}`;

    if (DEMO_MODE) {
      const order = {
        id: `order-${Date.now()}`,
        orderNumber,
        userId: userId || null,
        stripeSessionId,
        customerEmail: customerEmail || "unknown@example.com",
        customerName: customerName || "Customer",
        items,
        shippingAddress: shippingAddress || {
          name: customerName || "Customer",
          street1: "123 Demo St",
          city: "Demo City",
          state: "DS",
          postalCode: "12345",
          country: "US",
        },
        subtotal: subtotal || 0,
        shippingCost: shippingCost || 0,
        total: total || 0,
        status: "paid",
        isGift: isGift || false,
        giftMessage: giftMessage || undefined,
        notes: notes || undefined,
        createdAt: now,
        updatedAt: now,
      };

      demoOrders.set(order.id, order);

      // Route to partners (demo)
      for (const item of items) {
        if (item.partnerId) {
          console.log(`[Demo] Routing item ${item.productName} to partner ${item.partnerId}`);
        }
      }

      return NextResponse.json({ order }, { status: 201 });
    }

    const supabase = await createServerSupabaseClient();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("shop_orders")
      .insert({
        order_number: orderNumber,
        stripe_session_id: stripeSessionId,
        user_id: userId || null,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_name: shippingAddress?.name,
        shipping_street1: shippingAddress?.street1,
        shipping_street2: shippingAddress?.street2,
        shipping_city: shippingAddress?.city,
        shipping_state: shippingAddress?.state,
        shipping_postal_code: shippingAddress?.postalCode,
        shipping_country: shippingAddress?.country,
        subtotal,
        shipping_cost: shippingCost,
        total,
        status: "paid",
        is_gift: isGift || false,
        gift_message: giftMessage,
        notes,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      customization: item.customization ? JSON.stringify(item.customization) : null,
      partner_id: item.partnerId || null,
    }));

    const { error: itemsError } = await supabase
      .from("shop_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      // Don't fail the order, just log
    }

    // Route items to partners
    const partnerItems = new Map();
    for (const item of items) {
      if (item.partnerId) {
        const existing = partnerItems.get(item.partnerId) || [];
        existing.push(item);
        partnerItems.set(item.partnerId, existing);
      }
    }

    // Route to each partner
    for (const [partnerId, partnerItemList] of partnerItems.entries()) {
      // Get partner details
      const { data: partner } = await supabase
        .from("shop_partners")
        .select("*")
        .eq("id", partnerId)
        .single();

      if (partner) {
        const orderPayload = {
          orderId: order.id,
          orderNumber: order.order_number,
          customerEmail,
          customerName,
          items: partnerItemList,
          shippingAddress,
          subtotal: partnerItemList.reduce(
            (sum: number, i: { unitPrice: number; quantity: number }) =>
              sum + i.unitPrice * i.quantity,
            0
          ),
          shippingCost: 0, // Partner handles their portion
          total: partnerItemList.reduce(
            (sum: number, i: { unitPrice: number; quantity: number }) =>
              sum + i.unitPrice * i.quantity,
            0
          ),
          notes,
          giftMessage,
          isGift: isGift || false,
          createdAt: now,
        };

        const result = await routeOrderToPartner(partner, orderPayload);
        console.log(`Routed to partner ${partner.name}:`, result);

        // Update order items with partner order ID
        if (result.success && result.partnerOrderId) {
          await supabase
            .from("shop_order_items")
            .update({
              partner_order_id: result.partnerOrderId,
              partner_status: "sent",
            })
            .eq("order_id", order.id)
            .eq("partner_id", partnerId);
        }
      }
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/shop/orders - Update order status (admin)
export async function PATCH(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, status, trackingNumber, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (notes !== undefined) updates.notes = notes;

    if (DEMO_MODE) {
      const order = demoOrders.get(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const updated = { ...order, ...updates };
      demoOrders.set(orderId, updated);

      return NextResponse.json({ order: updated });
    }

    const supabase = await createServerSupabaseClient();

    const { data: order, error } = await supabase
      .from("shop_orders")
      .update({
        status: updates.status,
        tracking_number: updates.trackingNumber,
        notes: updates.notes,
        updated_at: updates.updatedAt,
      })
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
