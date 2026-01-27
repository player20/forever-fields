import type { Product, CartItem, ShippingAddress, ShippingMethod, ShippingOption } from "@/types/shop";
import { SHIPPING_ZONES, EXPRESS_MULTIPLIER, OVERNIGHT_MULTIPLIER, STATE_TAX_RATES } from "@/data/shipping-zones";

export function calculateItemPrice(
  product: Product,
  options: Record<string, string>,
  isRush: boolean
): number {
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

export function calculateShipping(
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

export function calculateTax(subtotal: number, state: string, country: string): number {
  if (country !== "US") return 0;
  const rate = STATE_TAX_RATES[state] || 0;
  return Math.round(subtotal * rate * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function generateOrderId(): string {
  return `FF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
