"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ProductCategory =
  | "photo_books"
  | "qr_plaques"
  | "memorial_cards"
  | "canvas_prints"
  | "urns"
  | "jewelry"
  | "keepsakes"
  | "flowers"
  | "donations";

type ProductType =
  | "photo_book_standard"
  | "photo_book_premium"
  | "photo_book_leather"
  | "qr_plaque_bronze"
  | "qr_plaque_granite"
  | "qr_plaque_stainless"
  | "qr_plaque_ceramic"
  | "memorial_card_standard"
  | "memorial_card_folded"
  | "memorial_card_bookmark"
  | "prayer_card"
  | "thank_you_card"
  | "canvas_small"
  | "canvas_medium"
  | "canvas_large"
  | "canvas_gallery"
  | "urn_classic"
  | "urn_biodegradable"
  | "urn_keepsake"
  | "urn_companion"
  | "jewelry_pendant"
  | "jewelry_ring"
  | "jewelry_bracelet"
  | "thumbprint_keepsake"
  | "memorial_ornament"
  | "memorial_blanket"
  | "flower_arrangement"
  | "flower_standing"
  | "flower_casket"
  | "donation_tree"
  | "donation_charity"
  | "donation_scholarship";

type ShippingMethod = "standard" | "express" | "overnight" | "pickup" | "international";
type OrderStatus = "pending" | "proof_review" | "approved" | "production" | "shipped" | "delivered";

interface ProductOption {
  id: string;
  name: string;
  values: string[];
  priceModifiers?: Record<string, number>;
}

interface Product {
  id: ProductType;
  category: ProductCategory;
  name: string;
  description: string;
  basePrice: number;
  images: string[];
  options: ProductOption[];
  customizable: boolean;
  customizationOptions?: {
    allowPhoto: boolean;
    allowText: boolean;
    allowDesign: boolean;
    maxPhotos?: number;
    maxTextLength?: number;
    textFields?: Array<{ name: string; placeholder: string; required: boolean }>;
  };
  productionDays: number;
  rushAvailable: boolean;
  rushDays?: number;
  rushPriceMultiplier?: number;
  weight: number; // in ounces for shipping
  dimensions?: { width: number; height: number; depth: number };
  inStock: boolean;
  requiresProofApproval: boolean;
  minimumQuantity?: number;
  bulkDiscounts?: Array<{ quantity: number; discount: number }>;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
  customization?: {
    photos: Array<{ id: string; url: string; position?: string }>;
    textFields: Record<string, string>;
    designId?: string;
  };
  isRush: boolean;
  unitPrice: number;
  totalPrice: number;
  proofUrl?: string;
  proofStatus?: "pending" | "approved" | "revision_requested";
  notes?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  isResidential: boolean;
}

interface ShippingOption {
  method: ShippingMethod;
  carrier: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  guaranteedDate?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod: ShippingOption;
  subtotal: number;
  shippingCost: number;
  tax: number;
  rushFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  proofApprovalDeadline?: string;
  specialInstructions?: string;
  giftMessage?: string;
  isGift: boolean;
}

interface PromoCode {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validCategories?: ProductCategory[];
  expiresAt?: string;
}

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

const PRODUCT_CATALOG: Product[] = [
  // Photo Books
  {
    id: "photo_book_standard",
    category: "photo_books",
    name: "Classic Photo Book",
    description: "Beautiful hardcover photo book with up to 50 pages. Perfect for preserving cherished memories.",
    basePrice: 49.99,
    images: ["/products/photo-book-standard.jpg"],
    options: [
      { id: "size", name: "Size", values: ["8x8", "8x11", "11x14"], priceModifiers: { "8x8": 0, "8x11": 20, "11x14": 40 } },
      { id: "pages", name: "Pages", values: ["20", "30", "40", "50"], priceModifiers: { "20": 0, "30": 10, "40": 20, "50": 30 } },
      { id: "cover", name: "Cover Style", values: ["Matte", "Glossy"], priceModifiers: { "Matte": 0, "Glossy": 5 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 100,
      maxTextLength: 500,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "subtitle", placeholder: "1945 - 2024", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 32,
    dimensions: { width: 8, height: 8, depth: 0.5 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "photo_book_premium",
    category: "photo_books",
    name: "Premium Layflat Photo Book",
    description: "Luxurious layflat binding ensures seamless panoramic spreads. Archival quality paper.",
    basePrice: 89.99,
    images: ["/products/photo-book-premium.jpg"],
    options: [
      { id: "size", name: "Size", values: ["10x10", "12x12", "12x15"], priceModifiers: { "10x10": 0, "12x12": 30, "12x15": 50 } },
      { id: "pages", name: "Pages", values: ["20", "30", "40", "50", "60"], priceModifiers: { "20": 0, "30": 15, "40": 30, "50": 45, "60": 60 } },
      { id: "paper", name: "Paper Type", values: ["Luster", "Pearl", "Deep Matte"], priceModifiers: { "Luster": 0, "Pearl": 10, "Deep Matte": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 150,
      maxTextLength: 1000,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "subtitle", placeholder: "1945 - 2024", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false },
        { name: "quote", placeholder: "A favorite quote or verse...", required: false }
      ]
    },
    productionDays: 10,
    rushAvailable: true,
    rushDays: 5,
    rushPriceMultiplier: 1.75,
    weight: 48,
    dimensions: { width: 10, height: 10, depth: 0.75 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "photo_book_leather",
    category: "photo_books",
    name: "Heirloom Leather Photo Book",
    description: "Genuine leather cover with gold embossing. A treasured keepsake for generations.",
    basePrice: 149.99,
    images: ["/products/photo-book-leather.jpg"],
    options: [
      { id: "size", name: "Size", values: ["10x10", "12x12"], priceModifiers: { "10x10": 0, "12x12": 40 } },
      { id: "leather", name: "Leather Color", values: ["Black", "Brown", "Burgundy", "Navy"], priceModifiers: {} },
      { id: "embossing", name: "Embossing", values: ["None", "Name Only", "Name & Dates", "Custom Text"], priceModifiers: { "None": 0, "Name Only": 15, "Name & Dates": 20, "Custom Text": 30 } },
      { id: "pages", name: "Pages", values: ["30", "40", "50", "60"], priceModifiers: { "30": 0, "40": 20, "50": 40, "60": 60 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 150,
      maxTextLength: 1000,
      textFields: [
        { name: "title", placeholder: "In Loving Memory of...", required: true },
        { name: "embossing_text", placeholder: "Text for cover embossing...", required: false },
        { name: "dedication", placeholder: "Dedicated to our beloved...", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: true,
    rushDays: 7,
    rushPriceMultiplier: 2,
    weight: 64,
    dimensions: { width: 10, height: 10, depth: 1 },
    inStock: true,
    requiresProofApproval: true
  },

  // QR Plaques
  {
    id: "qr_plaque_bronze",
    category: "qr_plaques",
    name: "Bronze Memorial QR Plaque",
    description: "Weather-resistant bronze plaque with laser-engraved QR code linking to the memorial page.",
    basePrice: 79.99,
    images: ["/products/qr-plaque-bronze.jpg"],
    options: [
      { id: "size", name: "Size", values: ["3x3", "4x4", "5x5"], priceModifiers: { "3x3": 0, "4x4": 25, "5x5": 50 } },
      { id: "mounting", name: "Mounting", values: ["Adhesive", "Screw Holes", "Stake"], priceModifiers: { "Adhesive": 0, "Screw Holes": 5, "Stake": 15 } },
      { id: "finish", name: "Finish", values: ["Polished", "Antiqued", "Brushed"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 100,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: true }
      ]
    },
    productionDays: 10,
    rushAvailable: true,
    rushDays: 5,
    rushPriceMultiplier: 1.5,
    weight: 24,
    dimensions: { width: 4, height: 4, depth: 0.25 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "qr_plaque_granite",
    category: "qr_plaques",
    name: "Granite Memorial QR Marker",
    description: "Elegant black granite marker with etched QR code. Suitable for cemetery placement.",
    basePrice: 129.99,
    images: ["/products/qr-plaque-granite.jpg"],
    options: [
      { id: "size", name: "Size", values: ["6x6", "8x8", "10x10"], priceModifiers: { "6x6": 0, "8x8": 50, "10x10": 100 } },
      { id: "shape", name: "Shape", values: ["Square", "Heart", "Oval"], priceModifiers: { "Square": 0, "Heart": 30, "Oval": 20 } },
      { id: "design", name: "Border Design", values: ["None", "Simple", "Floral", "Religious"], priceModifiers: { "None": 0, "Simple": 15, "Floral": 25, "Religious": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 150,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "epitaph", placeholder: "Short epitaph or verse...", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: false,
    weight: 160,
    dimensions: { width: 6, height: 6, depth: 1 },
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "qr_plaque_stainless",
    category: "qr_plaques",
    name: "Stainless Steel QR Tag",
    description: "Modern stainless steel tag with QR code. Perfect for garden memorials or keepsakes.",
    basePrice: 34.99,
    images: ["/products/qr-plaque-stainless.jpg"],
    options: [
      { id: "size", name: "Size", values: ["2x2", "3x3"], priceModifiers: { "2x2": 0, "3x3": 15 } },
      { id: "chain", name: "Include Chain", values: ["No", "Yes"], priceModifiers: { "No": 0, "Yes": 8 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 50,
      textFields: [
        { name: "name", placeholder: "Name", required: true }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 4,
    dimensions: { width: 2, height: 2, depth: 0.1 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "qr_plaque_ceramic",
    category: "qr_plaques",
    name: "Ceramic Photo QR Tile",
    description: "Full-color ceramic tile with photo and QR code. UV-resistant for outdoor use.",
    basePrice: 59.99,
    images: ["/products/qr-plaque-ceramic.jpg"],
    options: [
      { id: "size", name: "Size", values: ["4x4", "6x6", "8x8"], priceModifiers: { "4x4": 0, "6x6": 20, "8x8": 40 } },
      { id: "frame", name: "Frame", values: ["None", "Bronze Frame", "Silver Frame"], priceModifiers: { "None": 0, "Bronze Frame": 25, "Silver Frame": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.75,
    weight: 16,
    dimensions: { width: 4, height: 4, depth: 0.25 },
    inStock: true,
    requiresProofApproval: true
  },

  // Memorial Cards
  {
    id: "memorial_card_standard",
    category: "memorial_cards",
    name: "Memorial Prayer Cards",
    description: "Traditional prayer cards with photo and prayer. Pack of 100.",
    basePrice: 49.99,
    images: ["/products/memorial-card-standard.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["100", "200", "300", "500"], priceModifiers: { "100": 0, "200": 30, "300": 55, "500": 85 } },
      { id: "finish", name: "Finish", values: ["Matte", "Glossy", "Linen"], priceModifiers: { "Matte": 0, "Glossy": 5, "Linen": 10 } },
      { id: "lamination", name: "Lamination", values: ["None", "Single Side", "Both Sides"], priceModifiers: { "None": 0, "Single Side": 15, "Both Sides": 25 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 300,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "prayer", placeholder: "Prayer or poem...", required: false },
        { name: "verse", placeholder: "Scripture verse...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 8,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 100,
    bulkDiscounts: [
      { quantity: 200, discount: 0.1 },
      { quantity: 500, discount: 0.15 }
    ]
  },
  {
    id: "memorial_card_folded",
    category: "memorial_cards",
    name: "Folded Memorial Programs",
    description: "Elegant folded programs with full obituary, photos, and order of service. Pack of 100.",
    basePrice: 89.99,
    images: ["/products/memorial-card-folded.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["50", "100", "150", "200"], priceModifiers: { "50": -20, "100": 0, "150": 40, "200": 75 } },
      { id: "size", name: "Size", values: ["5.5x8.5", "8.5x11"], priceModifiers: { "5.5x8.5": 0, "8.5x11": 30 } },
      { id: "paper", name: "Paper", values: ["100lb Gloss", "100lb Matte", "Linen"], priceModifiers: { "100lb Gloss": 0, "100lb Matte": 5, "Linen": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 10,
      maxTextLength: 2000,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "Birth - Death", required: true },
        { name: "obituary", placeholder: "Full obituary text...", required: true },
        { name: "order_of_service", placeholder: "Order of service...", required: false },
        { name: "pallbearers", placeholder: "Pallbearer names...", required: false },
        { name: "acknowledgments", placeholder: "Family acknowledgments...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.75,
    weight: 16,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 50
  },
  {
    id: "memorial_card_bookmark",
    category: "memorial_cards",
    name: "Memorial Bookmarks",
    description: "Keepsake bookmarks with photo and verse. Pack of 50.",
    basePrice: 34.99,
    images: ["/products/memorial-bookmark.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["50", "100", "200"], priceModifiers: { "50": 0, "100": 25, "200": 45 } },
      { id: "tassel", name: "Tassel", values: ["None", "White", "Gold", "Silver", "Black"], priceModifiers: { "None": 0, "White": 10, "Gold": 10, "Silver": 10, "Black": 10 } },
      { id: "lamination", name: "Lamination", values: ["Yes", "No"], priceModifiers: { "Yes": 0, "No": -5 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 200,
      textFields: [
        { name: "name", placeholder: "Full Name", required: true },
        { name: "dates", placeholder: "1945 - 2024", required: true },
        { name: "verse", placeholder: "Favorite verse or quote...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 4,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 50
  },
  {
    id: "thank_you_card",
    category: "memorial_cards",
    name: "Thank You Cards",
    description: "Personalized thank you cards for those who supported during difficult times. Pack of 50.",
    basePrice: 39.99,
    images: ["/products/thank-you-card.jpg"],
    options: [
      { id: "quantity", name: "Quantity", values: ["25", "50", "100", "150"], priceModifiers: { "25": -10, "50": 0, "100": 35, "150": 65 } },
      { id: "style", name: "Style", values: ["Classic", "Modern", "Floral", "Religious"], priceModifiers: {} },
      { id: "envelopes", name: "Envelopes", values: ["White", "Cream", "Gray"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 1,
      maxTextLength: 500,
      textFields: [
        { name: "family_name", placeholder: "The Smith Family", required: true },
        { name: "message", placeholder: "Thank you message...", required: true }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 8,
    inStock: true,
    requiresProofApproval: true,
    minimumQuantity: 25
  },

  // Canvas Prints
  {
    id: "canvas_small",
    category: "canvas_prints",
    name: "Gallery Canvas - Small",
    description: "Museum-quality canvas print stretched on solid wood frame. 8x10 or 11x14.",
    basePrice: 39.99,
    images: ["/products/canvas-small.jpg"],
    options: [
      { id: "size", name: "Size", values: ["8x10", "11x14"], priceModifiers: { "8x10": 0, "11x14": 20 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 5, "White": 5, "Gallery": 10 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 35, "White": 35, "Natural": 40 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 16,
    dimensions: { width: 8, height: 10, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "canvas_medium",
    category: "canvas_prints",
    name: "Gallery Canvas - Medium",
    description: "Museum-quality canvas print. 16x20 or 18x24.",
    basePrice: 69.99,
    images: ["/products/canvas-medium.jpg"],
    options: [
      { id: "size", name: "Size", values: ["16x20", "18x24"], priceModifiers: { "16x20": 0, "18x24": 25 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 5, "White": 5, "Gallery": 10 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 55, "White": 55, "Natural": 60 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 32,
    dimensions: { width: 16, height: 20, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "canvas_large",
    category: "canvas_prints",
    name: "Gallery Canvas - Large",
    description: "Statement piece canvas print. 24x36 or 30x40.",
    basePrice: 119.99,
    images: ["/products/canvas-large.jpg"],
    options: [
      { id: "size", name: "Size", values: ["24x36", "30x40"], priceModifiers: { "24x36": 0, "30x40": 50 } },
      { id: "wrap", name: "Edge Wrap", values: ["Mirror", "Black", "White", "Gallery"], priceModifiers: { "Mirror": 0, "Black": 10, "White": 10, "Gallery": 15 } },
      { id: "frame", name: "Floating Frame", values: ["None", "Black", "White", "Natural"], priceModifiers: { "None": 0, "Black": 95, "White": 95, "Natural": 105 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 100,
      textFields: [
        { name: "caption", placeholder: "Optional caption...", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 64,
    dimensions: { width: 24, height: 36, depth: 1.5 },
    inStock: true,
    requiresProofApproval: false
  },

  // Memorial Jewelry
  {
    id: "jewelry_pendant",
    category: "jewelry",
    name: "Thumbprint Heart Pendant",
    description: "Sterling silver heart pendant engraved with actual thumbprint. Includes chain.",
    basePrice: 89.99,
    images: ["/products/jewelry-pendant.jpg"],
    options: [
      { id: "metal", name: "Metal", values: ["Sterling Silver", "14K Gold Plated", "14K Gold"], priceModifiers: { "Sterling Silver": 0, "14K Gold Plated": 30, "14K Gold": 350 } },
      { id: "chain_length", name: "Chain Length", values: ["16\"", "18\"", "20\"", "24\""], priceModifiers: {} },
      { id: "shape", name: "Shape", values: ["Heart", "Oval", "Round", "Dog Tag"], priceModifiers: { "Heart": 0, "Oval": 10, "Round": 0, "Dog Tag": 15 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true, // Thumbprint image
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 30,
      textFields: [
        { name: "engraving_front", placeholder: "Name", required: false },
        { name: "engraving_back", placeholder: "Dates or message", required: false }
      ]
    },
    productionDays: 14,
    rushAvailable: false,
    weight: 1,
    inStock: true,
    requiresProofApproval: true
  },
  {
    id: "jewelry_bracelet",
    category: "jewelry",
    name: "Memorial Bead Bracelet",
    description: "Handmade beaded bracelet with custom charm. Cremation ash bead optional.",
    basePrice: 49.99,
    images: ["/products/jewelry-bracelet.jpg"],
    options: [
      { id: "size", name: "Wrist Size", values: ["Small (6\")", "Medium (7\")", "Large (8\")"], priceModifiers: {} },
      { id: "beads", name: "Bead Style", values: ["Rose Quartz", "Onyx", "Howlite", "Lava Stone"], priceModifiers: {} },
      { id: "ash_bead", name: "Include Ash Bead", values: ["No", "Yes"], priceModifiers: { "No": 0, "Yes": 45 } },
      { id: "charm", name: "Charm", values: ["Heart", "Angel Wing", "Cross", "Tree of Life", "Infinity"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 20,
      textFields: [
        { name: "charm_engraving", placeholder: "Initial or date", required: false }
      ]
    },
    productionDays: 10,
    rushAvailable: false,
    weight: 1,
    inStock: true,
    requiresProofApproval: false
  },

  // Keepsakes
  {
    id: "memorial_ornament",
    category: "keepsakes",
    name: "Photo Memorial Ornament",
    description: "Porcelain ornament with custom photo. Perfect for holiday remembrance.",
    basePrice: 24.99,
    images: ["/products/memorial-ornament.jpg"],
    options: [
      { id: "shape", name: "Shape", values: ["Round", "Heart", "Star", "Angel"], priceModifiers: { "Round": 0, "Heart": 5, "Star": 5, "Angel": 10 } },
      { id: "ribbon", name: "Ribbon Color", values: ["Gold", "Silver", "Red", "White"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: false,
      maxPhotos: 1,
      maxTextLength: 50,
      textFields: [
        { name: "name", placeholder: "Name", required: true },
        { name: "year", placeholder: "Year", required: false }
      ]
    },
    productionDays: 5,
    rushAvailable: true,
    rushDays: 2,
    rushPriceMultiplier: 1.5,
    weight: 2,
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "memorial_blanket",
    category: "keepsakes",
    name: "Photo Collage Blanket",
    description: "Super-soft fleece blanket with custom photo collage. 50x60 inches.",
    basePrice: 69.99,
    images: ["/products/memorial-blanket.jpg"],
    options: [
      { id: "size", name: "Size", values: ["50x60", "60x80"], priceModifiers: { "50x60": 0, "60x80": 30 } },
      { id: "material", name: "Material", values: ["Fleece", "Sherpa", "Woven"], priceModifiers: { "Fleece": 0, "Sherpa": 25, "Woven": 40 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: true,
      allowText: true,
      allowDesign: true,
      maxPhotos: 20,
      maxTextLength: 100,
      textFields: [
        { name: "title", placeholder: "In Loving Memory", required: false }
      ]
    },
    productionDays: 7,
    rushAvailable: true,
    rushDays: 3,
    rushPriceMultiplier: 1.5,
    weight: 32,
    inStock: true,
    requiresProofApproval: true
  },

  // Flowers & Donations
  {
    id: "flower_arrangement",
    category: "flowers",
    name: "Sympathy Flower Arrangement",
    description: "Beautiful fresh flower arrangement delivered to service or home.",
    basePrice: 79.99,
    images: ["/products/flower-arrangement.jpg"],
    options: [
      { id: "size", name: "Size", values: ["Standard", "Deluxe", "Premium"], priceModifiers: { "Standard": 0, "Deluxe": 40, "Premium": 80 } },
      { id: "style", name: "Style", values: ["Traditional", "Garden", "Modern", "All White"], priceModifiers: {} },
      { id: "container", name: "Container", values: ["Basket", "Vase", "Ceramic Pot"], priceModifiers: { "Basket": 0, "Vase": 15, "Ceramic Pot": 20 } }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 200,
      textFields: [
        { name: "card_message", placeholder: "Card message...", required: true },
        { name: "from", placeholder: "From...", required: true }
      ]
    },
    productionDays: 1,
    rushAvailable: true,
    rushDays: 0,
    rushPriceMultiplier: 1.25,
    weight: 64,
    inStock: true,
    requiresProofApproval: false
  },
  {
    id: "donation_tree",
    category: "donations",
    name: "Memorial Tree Planting",
    description: "Plant a tree in their memory through One Tree Planted. Includes certificate.",
    basePrice: 25.00,
    images: ["/products/donation-tree.jpg"],
    options: [
      { id: "quantity", name: "Number of Trees", values: ["1", "5", "10", "25"], priceModifiers: { "1": 0, "5": 100, "10": 225, "25": 600 } },
      { id: "location", name: "Planting Region", values: ["North America", "South America", "Africa", "Asia", "Australia"], priceModifiers: {} }
    ],
    customizable: true,
    customizationOptions: {
      allowPhoto: false,
      allowText: true,
      allowDesign: false,
      maxTextLength: 200,
      textFields: [
        { name: "honoree_name", placeholder: "In Memory of...", required: true },
        { name: "dedication", placeholder: "Dedication message...", required: false }
      ]
    },
    productionDays: 3,
    rushAvailable: false,
    weight: 0,
    inStock: true,
    requiresProofApproval: false
  }
];

// ============================================================================
// SHIPPING RATES
// ============================================================================

interface ShippingZone {
  countries: string[];
  baseRate: number;
  perPoundRate: number;
  deliveryDays: { min: number; max: number };
}

const SHIPPING_ZONES: Record<string, ShippingZone> = {
  domestic: {
    countries: ["US"],
    baseRate: 5.99,
    perPoundRate: 0.75,
    deliveryDays: { min: 3, max: 7 }
  },
  canada: {
    countries: ["CA"],
    baseRate: 12.99,
    perPoundRate: 1.50,
    deliveryDays: { min: 7, max: 14 }
  },
  europe: {
    countries: ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH", "IE"],
    baseRate: 24.99,
    perPoundRate: 2.50,
    deliveryDays: { min: 10, max: 21 }
  },
  australia: {
    countries: ["AU", "NZ"],
    baseRate: 29.99,
    perPoundRate: 3.00,
    deliveryDays: { min: 14, max: 28 }
  },
  international: {
    countries: [],
    baseRate: 34.99,
    perPoundRate: 4.00,
    deliveryDays: { min: 14, max: 35 }
  }
};

const EXPRESS_MULTIPLIER = 2.5;
const OVERNIGHT_MULTIPLIER = 5;

// ============================================================================
// TAX RATES BY STATE
// ============================================================================

const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AK: 0, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029, CT: 0.0635,
  DE: 0, DC: 0.06, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625,
  IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055, MD: 0.06,
  MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07, MO: 0.04225, MT: 0, NE: 0.055,
  NV: 0.0685, NH: 0, NJ: 0.06625, NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, OR: 0, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.045,
  TN: 0.07, TX: 0.0625, UT: 0.0485, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06,
  WI: 0.05, WY: 0.04
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateItemPrice(product: Product, options: Record<string, string>, isRush: boolean): number {
  let price = product.basePrice;

  // Add option price modifiers
  for (const option of product.options) {
    const selectedValue = options[option.id];
    if (selectedValue && option.priceModifiers && option.priceModifiers[selectedValue]) {
      price += option.priceModifiers[selectedValue];
    }
  }

  // Apply rush multiplier
  if (isRush && product.rushAvailable && product.rushPriceMultiplier) {
    price *= product.rushPriceMultiplier;
  }

  return price;
}

function calculateShipping(
  items: CartItem[],
  address: ShippingAddress,
  method: ShippingMethod
): ShippingOption | null {
  if (method === "pickup") {
    return {
      method: "pickup",
      carrier: "Local Pickup",
      serviceName: "In-Store Pickup",
      price: 0,
      estimatedDays: 0
    };
  }

  // Find shipping zone
  let zone = SHIPPING_ZONES.domestic;
  if (address.country !== "US") {
    zone = Object.values(SHIPPING_ZONES).find(z => z.countries.includes(address.country))
      || SHIPPING_ZONES.international;
  }

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + (item.product.weight * item.quantity), 0);
  const weightInPounds = totalWeight / 16;

  // Calculate base shipping
  let shippingCost = zone.baseRate + (weightInPounds * zone.perPoundRate);
  let estimatedDays = zone.deliveryDays.max;
  let carrier = "USPS";
  let serviceName = "Standard Shipping";

  if (method === "express") {
    shippingCost *= EXPRESS_MULTIPLIER;
    estimatedDays = Math.ceil(zone.deliveryDays.min / 2);
    carrier = "UPS";
    serviceName = "Express Shipping";
  } else if (method === "overnight") {
    if (address.country !== "US") {
      return null; // Overnight not available internationally
    }
    shippingCost *= OVERNIGHT_MULTIPLIER;
    estimatedDays = 1;
    carrier = "FedEx";
    serviceName = "Overnight Shipping";
  } else if (method === "international") {
    carrier = "DHL";
    serviceName = "International Priority";
  }

  return {
    method,
    carrier,
    serviceName,
    price: Math.round(shippingCost * 100) / 100,
    estimatedDays
  };
}

function calculateTax(subtotal: number, state: string, country: string): number {
  if (country !== "US") return 0;
  const rate = STATE_TAX_RATES[state] || 0;
  return Math.round(subtotal * rate * 100) / 100;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function generateOrderId(): string {
  return `FF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface MemorialShopProps {
  memorialId?: string;
  deceasedName?: string;
  deceasedPhoto?: string;
  onOrderComplete?: (order: Order) => void;
}

type ShopView =
  | "catalog"
  | "product"
  | "customize"
  | "cart"
  | "checkout_address"
  | "checkout_shipping"
  | "checkout_payment"
  | "checkout_review"
  | "confirmation"
  | "proof_review";

export function MemorialShop({
  memorialId: _memorialId,
  deceasedName = "",
  deceasedPhoto,
  onOrderComplete
}: MemorialShopProps) {
  // View state
  const [view, setView] = useState<ShopView>("catalog");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<CartItem> | null>(null);

  // Checkout state
  const [shippingAddress, setShippingAddress] = useState<Partial<ShippingAddress>>({
    country: "US",
    isResidential: true
  });
  const [billingAddress, _setBillingAddress] = useState<Partial<ShippingAddress>>({});
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Error/loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed values
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return PRODUCT_CATALOG;
    return PRODUCT_CATALOG.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const cartSubtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.totalPrice, 0)
  , [cart]);

  const rushItems = useMemo(() =>
    cart.filter(item => item.isRush)
  , [cart]);

  const rushFee = useMemo(() =>
    rushItems.reduce((sum, item) => {
      const basePrice = calculateItemPrice(item.product, item.selectedOptions, false);
      return sum + ((item.unitPrice - basePrice) * item.quantity);
    }, 0)
  , [rushItems]);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percentage") {
      const discount = cartSubtotal * (appliedPromo.value / 100);
      return appliedPromo.maxDiscount ? Math.min(discount, appliedPromo.maxDiscount) : discount;
    } else if (appliedPromo.type === "fixed") {
      return appliedPromo.value;
    }
    return 0;
  }, [appliedPromo, cartSubtotal]);

  const tax = useMemo(() =>
    calculateTax(
      cartSubtotal - promoDiscount,
      shippingAddress.state || "",
      shippingAddress.country || "US"
    )
  , [cartSubtotal, promoDiscount, shippingAddress.state, shippingAddress.country]);

  const shippingCost = useMemo(() => {
    if (appliedPromo?.type === "free_shipping") return 0;
    return selectedShipping?.price || 0;
  }, [selectedShipping, appliedPromo]);

  const orderTotal = useMemo(() =>
    Math.max(0, cartSubtotal - promoDiscount + tax + shippingCost)
  , [cartSubtotal, promoDiscount, tax, shippingCost]);

  // Category labels
  const categoryLabels: Record<ProductCategory | "all", string> = {
    all: "All Products",
    photo_books: "Photo Books",
    qr_plaques: "QR Plaques",
    memorial_cards: "Cards & Programs",
    canvas_prints: "Canvas Prints",
    urns: "Urns",
    jewelry: "Memorial Jewelry",
    keepsakes: "Keepsakes",
    flowers: "Flowers",
    donations: "Memorial Donations"
  };

  // Handlers
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !currentItem) return;

    const newItem: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      product: selectedProduct,
      quantity: currentItem.quantity || 1,
      selectedOptions: currentItem.selectedOptions || {},
      customization: currentItem.customization,
      isRush: currentItem.isRush || false,
      unitPrice: calculateItemPrice(
        selectedProduct,
        currentItem.selectedOptions || {},
        currentItem.isRush || false
      ),
      totalPrice: 0,
      proofStatus: selectedProduct.requiresProofApproval ? "pending" : undefined,
      notes: currentItem.notes
    };
    newItem.totalPrice = newItem.unitPrice * newItem.quantity;

    setCart(prev => [...prev, newItem]);
    setCurrentItem(null);
    setSelectedProduct(null);
    setView("cart");
  }, [selectedProduct, currentItem]);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const minQty = item.product.minimumQuantity || 1;
      const newQty = Math.max(minQty, quantity);
      return {
        ...item,
        quantity: newQty,
        totalPrice: item.unitPrice * newQty
      };
    }));
  }, []);

  const handleApplyPromo = useCallback(() => {
    // Demo promo codes
    const promos: Record<string, PromoCode> = {
      "MEMORIAL10": { code: "MEMORIAL10", type: "percentage", value: 10 },
      "FREESHIP": { code: "FREESHIP", type: "free_shipping", value: 0, minOrderAmount: 50 },
      "SAVE20": { code: "SAVE20", type: "fixed", value: 20, minOrderAmount: 100 }
    };

    const promo = promos[promoCode.toUpperCase()];
    if (!promo) {
      setErrors(prev => ({ ...prev, promo: "Invalid promo code" }));
      return;
    }
    if (promo.minOrderAmount && cartSubtotal < promo.minOrderAmount) {
      setErrors(prev => ({
        ...prev,
        promo: `Minimum order of ${formatCurrency(promo.minOrderAmount ?? 0)} required`
      }));
      return;
    }

    setAppliedPromo(promo);
    setErrors(prev => ({ ...prev, promo: "" }));
  }, [promoCode, cartSubtotal]);

  const validateShippingAddress = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!shippingAddress.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!shippingAddress.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!shippingAddress.street1?.trim()) newErrors.street1 = "Street address is required";
    if (!shippingAddress.city?.trim()) newErrors.city = "City is required";
    if (!shippingAddress.state?.trim() && shippingAddress.country === "US") {
      newErrors.state = "State is required";
    }
    if (!shippingAddress.postalCode?.trim()) newErrors.postalCode = "ZIP/Postal code is required";
    if (!shippingAddress.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!shippingAddress.phone?.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [shippingAddress]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedShipping) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const order: Order = {
      id: generateOrderId(),
      items: cart,
      shippingAddress: shippingAddress as ShippingAddress,
      billingAddress: billingSameAsShipping
        ? shippingAddress as ShippingAddress
        : billingAddress as ShippingAddress,
      shippingMethod: selectedShipping,
      subtotal: cartSubtotal,
      shippingCost,
      tax,
      rushFee,
      discount: promoDiscount,
      total: orderTotal,
      status: cart.some(item => item.proofStatus === "pending") ? "proof_review" : "pending",
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(
        Date.now() + (selectedShipping.estimatedDays +
          Math.max(...cart.map(i => i.isRush && i.product.rushDays
            ? i.product.rushDays
            : i.product.productionDays))) * 24 * 60 * 60 * 1000
      ).toISOString(),
      specialInstructions,
      giftMessage: isGift ? giftMessage : undefined,
      isGift
    };

    setCompletedOrder(order);
    setCart([]);
    setView("confirmation");
    setIsProcessing(false);

    onOrderComplete?.(order);
  }, [
    cart, shippingAddress, billingAddress, billingSameAsShipping, selectedShipping,
    cartSubtotal, shippingCost, tax, rushFee, promoDiscount, orderTotal,
    specialInstructions, isGift, giftMessage, onOrderComplete
  ]);

  // Render product card
  const renderProductCard = (product: Product) => (
    <Card
      key={product.id}
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => {
        setSelectedProduct(product);
        setCurrentItem({
          product,
          quantity: product.minimumQuantity || 1,
          selectedOptions: Object.fromEntries(
            product.options.map(opt => [opt.id, opt.values[0]])
          ),
          customization: product.customizable ? {
            photos: deceasedPhoto ? [{ id: "1", url: deceasedPhoto }] : [],
            textFields: deceasedName ? { name: deceasedName } : {}
          } : undefined,
          isRush: false
        });
        setView("product");
      }}
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl">
          {product.category === "photo_books" && "📖"}
          {product.category === "qr_plaques" && "🏷️"}
          {product.category === "memorial_cards" && "📄"}
          {product.category === "canvas_prints" && "🖼️"}
          {product.category === "urns" && "⚱️"}
          {product.category === "jewelry" && "💎"}
          {product.category === "keepsakes" && "🎁"}
          {product.category === "flowers" && "💐"}
          {product.category === "donations" && "🌳"}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{product.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="font-bold text-primary-600">
          {formatCurrency(product.basePrice)}
          {product.options.length > 0 && "+"}
        </span>
        {!product.inStock && (
          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
        )}
      </div>
      {product.rushAvailable && (
        <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
          Rush Available
        </span>
      )}
    </Card>
  );

  // Render catalog view
  const renderCatalog = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Memorial Shop</h2>
        {cart.length > 0 && (
          <Button onClick={() => setView("cart")}>
            View Cart ({cart.length})
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(categoryLabels) as Array<ProductCategory | "all">).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(renderProductCard)}
      </div>
    </div>
  );

  // Render product detail
  const renderProductDetail = () => {
    if (!selectedProduct || !currentItem) return null;

    const itemPrice = calculateItemPrice(
      selectedProduct,
      currentItem.selectedOptions || {},
      currentItem.isRush || false
    );

    return (
      <div>
        <button
          onClick={() => { setView("catalog"); setSelectedProduct(null); }}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Shop
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product image */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-8xl">
              {selectedProduct.category === "photo_books" && "📖"}
              {selectedProduct.category === "qr_plaques" && "🏷️"}
              {selectedProduct.category === "memorial_cards" && "📄"}
              {selectedProduct.category === "canvas_prints" && "🖼️"}
              {selectedProduct.category === "urns" && "⚱️"}
              {selectedProduct.category === "jewelry" && "💎"}
              {selectedProduct.category === "keepsakes" && "🎁"}
              {selectedProduct.category === "flowers" && "💐"}
              {selectedProduct.category === "donations" && "🌳"}
            </span>
          </div>

          {/* Product details */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
            <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

            <div className="text-3xl font-bold text-primary-600 mb-6">
              {formatCurrency(itemPrice)}
            </div>

            {/* Options */}
            <div className="space-y-4 mb-6">
              {selectedProduct.options.map(option => (
                <div key={option.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map(value => {
                      const isSelected = currentItem.selectedOptions?.[option.id] === value;
                      const priceModifier = option.priceModifiers?.[value];
                      return (
                        <button
                          key={value}
                          onClick={() => setCurrentItem(prev => ({
                            ...prev,
                            selectedOptions: {
                              ...prev?.selectedOptions,
                              [option.id]: value
                            }
                          }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                            isSelected
                              ? "border-primary-600 bg-primary-50 text-primary-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {value}
                          {priceModifier && priceModifier > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              (+{formatCurrency(priceModifier)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rush order */}
            {selectedProduct.rushAvailable && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentItem.isRush || false}
                    onChange={(e) => setCurrentItem(prev => ({
                      ...prev,
                      isRush: e.target.checked
                    }))}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                  <div>
                    <span className="font-medium text-amber-800">Rush Order</span>
                    <p className="text-sm text-amber-700">
                      Get it in {selectedProduct.rushDays} days instead of {selectedProduct.productionDays} days
                      {selectedProduct.rushPriceMultiplier && (
                        <span> ({Math.round((selectedProduct.rushPriceMultiplier - 1) * 100)}% additional)</span>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentItem(prev => ({
                    ...prev,
                    quantity: Math.max((selectedProduct.minimumQuantity || 1), (prev?.quantity || 1) - 1)
                  }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{currentItem.quantity || 1}</span>
                <button
                  onClick={() => setCurrentItem(prev => ({
                    ...prev,
                    quantity: (prev?.quantity || 1) + 1
                  }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              {selectedProduct.minimumQuantity && (
                <p className="text-sm text-gray-500 mt-1">
                  Minimum quantity: {selectedProduct.minimumQuantity}
                </p>
              )}
            </div>

            {/* Customization button */}
            {selectedProduct.customizable && (
              <Button
                onClick={() => setView("customize")}
                variant="secondary"
                className="w-full mb-3"
              >
                Customize Product
              </Button>
            )}

            {/* Add to cart */}
            <Button
              onClick={handleAddToCart}
              disabled={!selectedProduct.inStock}
              className="w-full"
            >
              {selectedProduct.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>

            {/* Production info */}
            <div className="mt-6 text-sm text-gray-600">
              <p>Production time: {currentItem.isRush && selectedProduct.rushDays
                ? selectedProduct.rushDays
                : selectedProduct.productionDays} business days</p>
              {selectedProduct.requiresProofApproval && (
                <p className="text-amber-700 mt-1">
                  This product requires proof approval before production
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render customization view
  const renderCustomization = () => {
    if (!selectedProduct || !currentItem) return null;

    const customOpts = selectedProduct.customizationOptions;
    if (!customOpts) return null;

    return (
      <div>
        <button
          onClick={() => setView("product")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Product
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customize Your {selectedProduct.name}
        </h2>

        <div className="space-y-6">
          {/* Photo upload */}
          {customOpts.allowPhoto && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Photos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-2">
                  Drag and drop photos here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  {customOpts.maxPhotos === 1
                    ? "1 photo allowed"
                    : `Up to ${customOpts.maxPhotos} photos allowed`}
                </p>
                <Button variant="secondary" className="mt-4">
                  Upload Photos
                </Button>
              </div>
              {currentItem.customization?.photos && currentItem.customization.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {currentItem.customization.photos.map((photo, idx) => (
                    <div key={photo.id} className="relative">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        {photo.url ? (
                          <span className="text-sm text-gray-600">Photo {idx + 1}</span>
                        ) : (
                          <span className="text-gray-400">?</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Text fields */}
          {customOpts.allowText && customOpts.textFields && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Text & Inscriptions</h3>
              <div className="space-y-4">
                {customOpts.textFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.name === "obituary" || field.name === "dedication" || field.name === "message" ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={currentItem.customization?.textFields?.[field.name] || ""}
                        onChange={(e) => setCurrentItem(prev => ({
                          ...prev,
                          customization: {
                            ...prev?.customization,
                            photos: prev?.customization?.photos || [],
                            textFields: {
                              ...prev?.customization?.textFields,
                              [field.name]: e.target.value
                            }
                          }
                        }))}
                        rows={4}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={currentItem.customization?.textFields?.[field.name] || ""}
                        onChange={(e) => setCurrentItem(prev => ({
                          ...prev,
                          customization: {
                            ...prev?.customization,
                            photos: prev?.customization?.photos || [],
                            textFields: {
                              ...prev?.customization?.textFields,
                              [field.name]: e.target.value
                            }
                          }
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              {customOpts.maxTextLength && (
                <p className="text-sm text-gray-500 mt-2">
                  Maximum {customOpts.maxTextLength} characters per field
                </p>
              )}
            </Card>
          )}

          {/* Design selection */}
          {customOpts.allowDesign && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Choose a Design Template</h3>
              <div className="grid grid-cols-3 gap-4">
                {["Classic", "Modern", "Floral", "Religious", "Nature", "Custom"].map(design => (
                  <button
                    key={design}
                    className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 hover:border-primary-500 flex items-center justify-center text-sm font-medium text-gray-700"
                  >
                    {design}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Special notes */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Special Instructions</h3>
            <Textarea
              placeholder="Any special requests or notes about your order..."
              value={currentItem.notes || ""}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              rows={3}
            />
          </Card>
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={() => setView("product")} variant="secondary" className="flex-1">
            Back
          </Button>
          <Button onClick={() => setView("product")} className="flex-1">
            Save Customization
          </Button>
        </div>
      </div>
    );
  };

  // Render cart view
  const renderCart = () => (
    <div>
      <button
        onClick={() => setView("catalog")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Continue Shopping
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={() => setView("catalog")}>Browse Products</Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-3xl">
                      {item.product.category === "photo_books" && "📖"}
                      {item.product.category === "qr_plaques" && "🏷️"}
                      {item.product.category === "memorial_cards" && "📄"}
                      {item.product.category === "canvas_prints" && "🖼️"}
                      {item.product.category === "urns" && "⚱️"}
                      {item.product.category === "jewelry" && "💎"}
                      {item.product.category === "keepsakes" && "🎁"}
                      {item.product.category === "flowers" && "💐"}
                      {item.product.category === "donations" && "🌳"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="mr-3">{key}: {value}</span>
                      ))}
                    </div>
                    {item.isRush && (
                      <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        Rush Order
                      </span>
                    )}
                    {item.proofStatus === "pending" && (
                      <span className="inline-block mt-1 ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Proof Pending
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-primary-600">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {rushFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Rush Fee</span>
                    <span>Included</span>
                  </div>
                )}
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              {/* Promo code */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleApplyPromo} variant="secondary">
                    Apply
                  </Button>
                </div>
                {errors.promo && (
                  <p className="text-red-500 text-sm mt-1">{errors.promo}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cartSubtotal - promoDiscount)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">+ shipping & tax at checkout</p>
              </div>

              <Button
                onClick={() => setView("checkout_address")}
                className="w-full mt-4"
              >
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  // Render checkout address
  const renderCheckoutAddress = () => (
    <div>
      <button
        onClick={() => setView("cart")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Cart
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 ${idx === 0 ? "text-primary-600" : "text-gray-400"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx === 0 ? "bg-primary-600 text-white" : "bg-gray-200"
              }`}>
                {idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={shippingAddress.firstName || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                  error={errors.firstName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  value={shippingAddress.lastName || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                  error={errors.lastName}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company (optional)
                </label>
                <Input
                  value={shippingAddress.company || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <Input
                  value={shippingAddress.street1 || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street1: e.target.value }))}
                  error={errors.street1}
                  placeholder="Street address, P.O. box, c/o"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apt, Suite, etc. (optional)
                </label>
                <Input
                  value={shippingAddress.street2 || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street2: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  value={shippingAddress.city || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  error={errors.city}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <Input
                  value={shippingAddress.state || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  error={errors.state}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP/Postal Code *
                </label>
                <Input
                  value={shippingAddress.postalCode || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  error={errors.postalCode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  value={shippingAddress.country || "US"}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={shippingAddress.email || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                  error={errors.email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={shippingAddress.phone || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                  error={errors.phone}
                />
              </div>
            </div>

            {/* Gift options */}
            <div className="mt-6 pt-6 border-t">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <span className="font-medium text-gray-900">This is a gift</span>
              </label>
              {isGift && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gift Message (optional)
                  </label>
                  <Textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Include a personal message with your gift..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Price will not be shown on the packing slip
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Order summary sidebar */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal - promoDiscount)}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                if (validateShippingAddress()) {
                  setView("checkout_shipping");
                }
              }}
              className="w-full mt-4"
            >
              Continue to Shipping
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render checkout shipping
  const renderCheckoutShipping = () => {
    const shippingOptions: ShippingOption[] = [
      calculateShipping(cart, shippingAddress as ShippingAddress, "standard"),
      calculateShipping(cart, shippingAddress as ShippingAddress, "express"),
      shippingAddress.country === "US"
        ? calculateShipping(cart, shippingAddress as ShippingAddress, "overnight")
        : null,
      { method: "pickup", carrier: "Local", serviceName: "Local Pickup", price: 0, estimatedDays: 0 }
    ].filter((opt): opt is ShippingOption => opt !== null);

    return (
      <div>
        <button
          onClick={() => setView("checkout_address")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Address
        </button>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${idx <= 1 ? "text-primary-600" : "text-gray-400"}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx < 1 ? "bg-green-600 text-white" : idx === 1 ? "bg-primary-600 text-white" : "bg-gray-200"
                }`}>
                  {idx < 1 ? "✓" : idx + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </div>
              {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Method</h2>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                {shippingOptions.map(option => (
                  <label
                    key={option.method}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedShipping?.method === option.method
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.method === option.method}
                        onChange={() => setSelectedShipping(option)}
                        className="w-5 h-5 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.serviceName}</p>
                        <p className="text-sm text-gray-600">
                          {option.method === "pickup"
                            ? "Pick up at our location"
                            : `${option.carrier} - ${option.estimatedDays} business days`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      {option.price === 0 ? "FREE" : formatCurrency(option.price)}
                    </span>
                  </label>
                ))}
              </div>

              {/* Special instructions */}
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Instructions (optional)
                </label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Gate code, leave at door, etc..."
                  rows={2}
                />
              </div>
            </Card>
          </div>

          {/* Order summary sidebar */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{selectedShipping ? formatCurrency(shippingCost) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
              <Button
                onClick={() => setView("checkout_payment")}
                disabled={!selectedShipping}
                className="w-full mt-4"
              >
                Continue to Payment
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Render checkout payment (simplified)
  const renderCheckoutPayment = () => (
    <div>
      <button
        onClick={() => setView("checkout_shipping")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Shipping
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 ${idx <= 2 ? "text-primary-600" : "text-gray-400"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < 2 ? "bg-green-600 text-white" : idx === 2 ? "bg-primary-600 text-white" : "bg-gray-200"
              }`}>
                {idx < 2 ? "✓" : idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <p className="text-center text-gray-600 py-8">
              Payment form would integrate with Stripe or PayPal here.
              <br />
              For demo purposes, click continue to simulate payment.
            </p>

            {/* Billing address */}
            <div className="mt-6 pt-6 border-t">
              <label className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <span className="font-medium text-gray-900">
                  Billing address same as shipping
                </span>
              </label>
            </div>
          </Card>
        </div>

        {/* Order summary sidebar */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
            <Button
              onClick={() => setView("checkout_review")}
              className="w-full mt-4"
            >
              Review Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render checkout review
  const renderCheckoutReview = () => (
    <div>
      <button
        onClick={() => setView("checkout_payment")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Payment
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2 text-primary-600">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < 3 ? "bg-green-600 text-white" : "bg-primary-600 text-white"
              }`}>
                {idx < 3 ? "✓" : idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">
                      {item.product.category === "photo_books" && "📖"}
                      {item.product.category === "qr_plaques" && "🏷️"}
                      {item.product.category === "memorial_cards" && "📄"}
                      {item.product.category === "canvas_prints" && "🖼️"}
                      {item.product.category === "jewelry" && "💎"}
                      {item.product.category === "keepsakes" && "🎁"}
                      {item.product.category === "flowers" && "💐"}
                      {item.product.category === "donations" && "🌳"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.isRush && (
                      <span className="text-xs text-amber-700">Rush Order</span>
                    )}
                  </div>
                  <span className="font-bold">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Shipping address */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
              <button
                onClick={() => setView("checkout_address")}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-600">
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.street1}<br />
              {shippingAddress.street2 && <>{shippingAddress.street2}<br /></>}
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
              {shippingAddress.country}
            </p>
          </Card>

          {/* Shipping method */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 mb-2">Shipping Method</h3>
              <button
                onClick={() => setView("checkout_shipping")}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-600">
              {selectedShipping?.serviceName} - {selectedShipping?.carrier}
              <br />
              <span className="text-sm">
                Estimated delivery: {selectedShipping?.estimatedDays === 0
                  ? "Same day"
                  : `${selectedShipping?.estimatedDays} business days`}
              </span>
            </p>
          </Card>

          {/* Proof approval notice */}
          {cart.some(item => item.product.requiresProofApproval) && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Proof Approval Required</h3>
              <p className="text-blue-800 text-sm">
                Some items in your order require proof approval before production.
                You will receive an email with proof images within 1-2 business days.
                Production will begin after you approve the proofs.
              </p>
            </Card>
          )}
        </div>

        {/* Order total */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Total</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full mt-4"
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By placing this order, you agree to our Terms of Service and Privacy Policy
            </p>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render confirmation
  const renderConfirmation = () => {
    if (!completedOrder) return null;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. We&apos;ve sent a confirmation to {shippingAddress.email}.
        </p>

        <Card className="p-6 text-left mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Order #{completedOrder.id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              completedOrder.status === "proof_review"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}>
              {completedOrder.status === "proof_review" ? "Awaiting Proof Approval" : "Processing"}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span>{new Date(completedOrder.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery</span>
              <span>{new Date(completedOrder.estimatedDelivery).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(completedOrder.total)}</span>
            </div>
          </div>
        </Card>

        {completedOrder.status === "proof_review" && (
          <Card className="p-6 bg-blue-50 border-blue-200 text-left mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <p className="text-blue-800 text-sm">
              You will receive proof images via email within 1-2 business days.
              Please review them carefully and approve or request changes.
              Production will begin after your approval.
            </p>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={() => setView("catalog")} variant="secondary">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {view === "catalog" && renderCatalog()}
        {view === "product" && renderProductDetail()}
        {view === "customize" && renderCustomization()}
        {view === "cart" && renderCart()}
        {view === "checkout_address" && renderCheckoutAddress()}
        {view === "checkout_shipping" && renderCheckoutShipping()}
        {view === "checkout_payment" && renderCheckoutPayment()}
        {view === "checkout_review" && renderCheckoutReview()}
        {view === "confirmation" && renderConfirmation()}
      </div>
    </div>
  );
}

export default MemorialShop;
