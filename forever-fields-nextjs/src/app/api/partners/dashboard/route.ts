// Partner Dashboard API
// Get partner stats and overview

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/constants";

// Helper to get partner ID from auth header
function getPartnerId(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  const partnerId = request.headers.get("X-Partner-ID");

  if (partnerId) return partnerId;

  if (authHeader?.includes("ff_session_")) {
    return "partner-1";
  }

  return null;
}

// Demo partner data
const demoPartnerData: Record<string, {
  id: string;
  name: string;
  stats: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    commission: number;
    commissionPercent: number;
    avgOrderValue: number;
    thisMonthOrders: number;
    thisMonthRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
}> = {
  "partner-1": {
    id: "partner-1",
    name: "FlowerCo",
    stats: {
      totalOrders: 245,
      pendingOrders: 3,
      processingOrders: 5,
      shippedOrders: 12,
      deliveredOrders: 225,
      totalRevenue: 18375,
      commission: 2756.25,
      commissionPercent: 15,
      avgOrderValue: 75,
      thisMonthOrders: 28,
      thisMonthRevenue: 2100,
    },
    recentOrders: [
      {
        id: "po-2",
        orderNumber: "FF-12345680",
        productName: "Memorial Flower Arrangement",
        customerName: "Mary Johnson",
        status: "pending",
        total: 150,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "po-1",
        orderNumber: "FF-12345678",
        productName: "Memorial Flower Arrangement",
        customerName: "John Smith",
        status: "shipped",
        total: 75,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  "partner-2": {
    id: "partner-2",
    name: "StoneCraft Memorial",
    stats: {
      totalOrders: 156,
      pendingOrders: 2,
      processingOrders: 8,
      shippedOrders: 6,
      deliveredOrders: 140,
      totalRevenue: 23244,
      commission: 4648.80,
      commissionPercent: 20,
      avgOrderValue: 149,
      thisMonthOrders: 15,
      thisMonthRevenue: 2235,
    },
    recentOrders: [
      {
        id: "po-3",
        orderNumber: "FF-12345679",
        productName: "Personalized Memorial Stone",
        customerName: "Jane Doe",
        status: "processing",
        total: 149,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
};

// GET /api/partners/dashboard - Get partner dashboard data
export async function GET(request: NextRequest) {
  const partnerId = getPartnerId(request);

  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (DEMO_MODE) {
    const partnerData = demoPartnerData[partnerId] || demoPartnerData["partner-1"];
    return NextResponse.json(partnerData);
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from("shop_partners")
      .select("id, name, commission_percent")
      .eq("id", partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Get order stats
    const { data: orderItems } = await supabase
      .from("shop_order_items")
      .select("id, unit_price, quantity, partner_status, created_at")
      .eq("partner_id", partnerId);

    const items = orderItems || [];

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalOrders: items.length,
      pendingOrders: items.filter((i) => i.partner_status === "pending").length,
      processingOrders: items.filter((i) => i.partner_status === "processing").length,
      shippedOrders: items.filter((i) => i.partner_status === "shipped").length,
      deliveredOrders: items.filter((i) => i.partner_status === "delivered").length,
      totalRevenue: items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
      commission: 0,
      commissionPercent: partner.commission_percent || 15,
      avgOrderValue: 0,
      thisMonthOrders: items.filter((i) => new Date(i.created_at) >= startOfMonth).length,
      thisMonthRevenue: items
        .filter((i) => new Date(i.created_at) >= startOfMonth)
        .reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    };

    stats.commission = stats.totalRevenue * (stats.commissionPercent / 100);
    stats.avgOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    // Get recent orders
    const { data: recentOrderItems } = await supabase
      .from("shop_order_items")
      .select(`
        id,
        product_name,
        unit_price,
        quantity,
        partner_status,
        created_at,
        order:shop_orders(order_number, customer_name)
      `)
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentOrders = (recentOrderItems || []).map((item) => ({
      id: item.id,
      orderNumber: (item.order as { order_number: string })?.order_number || "N/A",
      productName: item.product_name,
      customerName: (item.order as { customer_name: string })?.customer_name || "Unknown",
      status: item.partner_status,
      total: item.unit_price * item.quantity,
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      id: partner.id,
      name: partner.name,
      stats,
      recentOrders,
    });
  } catch (error) {
    console.error("Partner dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
