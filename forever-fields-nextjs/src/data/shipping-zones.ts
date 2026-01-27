import type { ShippingZone } from "@/types/shop";

export const SHIPPING_ZONES: Record<string, ShippingZone> = {
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

export const EXPRESS_MULTIPLIER = 2.5;
export const OVERNIGHT_MULTIPLIER = 5;

export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AK: 0, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029, CT: 0.0635,
  DE: 0, DC: 0.06, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625,
  IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055, MD: 0.06,
  MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07, MO: 0.04225, MT: 0, NE: 0.055,
  NV: 0.0685, NH: 0, NJ: 0.06625, NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, OR: 0, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.045,
  TN: 0.07, TX: 0.0625, UT: 0.0485, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06,
  WI: 0.05, WY: 0.04
};
