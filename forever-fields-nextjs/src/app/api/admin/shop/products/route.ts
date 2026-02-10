// Admin API for shop products
// CRUD operations for shop products

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/server";

// In demo mode, use in-memory storage
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Demo products store
const demoProducts: Map<string, Record<string, unknown>> = new Map();

// Initialize with some demo products
if (demoProducts.size === 0) {
  const initialProducts = [
    {
      id: "1",
      name: "Memorial Flower Arrangement",
      slug: "memorial-flower-arrangement",
      category: "flowers",
      basePrice: 75,
      description: "Beautiful seasonal flowers delivered to the gravesite",
      inStock: true,
      isActive: true,
      partnerId: "1",
      fulfillmentType: "partner",
      productionDays: 2,
    },
    {
      id: "2",
      name: "Personalized Memorial Stone",
      slug: "personalized-memorial-stone",
      category: "keepsakes",
      basePrice: 149,
      description: "Custom engraved stone with name and dates",
      inStock: true,
      isActive: true,
      partnerId: "2",
      fulfillmentType: "partner",
      productionDays: 7,
    },
  ];

  initialProducts.forEach((p) => demoProducts.set(p.id, p));
}

// GET /api/admin/shop/products - List all products
export async function GET(_request: NextRequest) {
  // Check admin auth
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Check if user is admin

  if (DEMO_MODE) {
    return NextResponse.json({
      products: Array.from(demoProducts.values()),
    });
  }

  // In production, query from Prisma
  // const products = await prisma.shopProduct.findMany({
  //   include: { partner: true },
  //   orderBy: { createdAt: "desc" },
  // });

  return NextResponse.json({ products: [] });
}

// POST /api/admin/shop/products - Create a product
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  const { name, basePrice, category } = body;
  if (!name || !basePrice || !category) {
    return NextResponse.json(
      { error: "Name, price, and category are required" },
      { status: 400 }
    );
  }

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (DEMO_MODE) {
    const id = String(Date.now());
    const product = {
      id,
      slug,
      name,
      description: body.description || "",
      shortDescription: body.shortDescription || "",
      category,
      basePrice: parseFloat(basePrice),
      compareAtPrice: body.compareAtPrice ? parseFloat(body.compareAtPrice) : null,
      costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
      fulfillmentType: body.fulfillmentType || "partner",
      partnerId: body.partnerId || null,
      productionDays: parseInt(body.productionDays) || 3,
      inStock: body.inStock !== false,
      isActive: true,
      isCustomizable: body.isCustomizable || false,
      rushAvailable: body.rushAvailable || false,
      rushDays: body.rushDays ? parseInt(body.rushDays) : null,
      rushPriceMultiplier: body.rushPriceMultiplier ? parseFloat(body.rushPriceMultiplier) : null,
      weight: body.weight ? parseFloat(body.weight) : null,
      freeShipping: body.freeShipping || false,
      images: body.images || [],
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoProducts.set(id, product);

    return NextResponse.json({ product }, { status: 201 });
  }

  // In production, create via Prisma
  // const product = await prisma.shopProduct.create({ data: { ... } });

  return NextResponse.json({ product: null }, { status: 201 });
}
