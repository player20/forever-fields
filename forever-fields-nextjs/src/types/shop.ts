// Shop Types and Interfaces

export type ProductCategory =
  | "photo_books"
  | "qr_plaques"
  | "memorial_cards"
  | "canvas_prints"
  | "urns"
  | "jewelry"
  | "keepsakes"
  | "flowers"
  | "donations";

export type ProductType =
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

export type ShippingMethod = "standard" | "express" | "overnight" | "pickup" | "international";
export type OrderStatus = "pending" | "proof_review" | "approved" | "production" | "shipped" | "delivered";

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
  priceModifiers?: Record<string, number>;
}

export interface Product {
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
  weight: number;
  dimensions?: { width: number; height: number; depth: number };
  inStock: boolean;
  requiresProofApproval: boolean;
  minimumQuantity?: number;
  bulkDiscounts?: Array<{ quantity: number; discount: number }>;
}

export interface CartItem {
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

export interface ShippingAddress {
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

export interface ShippingOption {
  method: ShippingMethod;
  carrier: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  guaranteedDate?: string;
}

export interface Order {
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

export interface PromoCode {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validCategories?: ProductCategory[];
  expiresAt?: string;
}

export interface ShippingZone {
  countries: string[];
  baseRate: number;
  perPoundRate: number;
  deliveryDays: { min: number; max: number };
}

export type ShopView =
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

export const CATEGORY_LABELS: Record<ProductCategory | "all", string> = {
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
