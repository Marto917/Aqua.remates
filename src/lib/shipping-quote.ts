import {
  type FreeShippingSettings,
  DEFAULT_FREE_SHIPPING,
  qualifiesForFreeShipping,
} from "@/lib/free-shipping";
import {
  detectShippingZone,
  getShippingRateForZone,
  SHIPPING_ZONE_LABELS,
  type ShippingZone,
} from "@/lib/shipping-zones";

export type ShippingQuoteInput = {
  shippingMethod: "PICKUP" | "DELIVERY" | "SHIPPING_TO_COORDINATE";
  postalCode?: string | null;
  province?: string | null;
  subtotalAmount: number;
  cartCategoryIds: string[];
  freeShipping?: FreeShippingSettings;
};

export type ShippingQuote = {
  applies: boolean;
  zone: ShippingZone | null;
  zoneLabel: string | null;
  baseShippingAmount: number;
  shippingAmount: number;
  freeShipping: boolean;
  freeShippingReason: string | null;
  subtotalAmount: number;
  totalAmount: number;
  error: string | null;
};

export function computeShippingQuote(input: ShippingQuoteInput): ShippingQuote {
  const freeShipping = input.freeShipping ?? DEFAULT_FREE_SHIPPING;
  const subtotalAmount = input.subtotalAmount;

  if (input.shippingMethod !== "DELIVERY") {
    return {
      applies: false,
      zone: null,
      zoneLabel: null,
      baseShippingAmount: 0,
      shippingAmount: 0,
      freeShipping: false,
      freeShippingReason: null,
      subtotalAmount,
      totalAmount: subtotalAmount,
      error: null,
    };
  }

  const zone = detectShippingZone(input.postalCode ?? "", input.province);
  if (!zone) {
    return {
      applies: true,
      zone: null,
      zoneLabel: null,
      baseShippingAmount: 0,
      shippingAmount: 0,
      freeShipping: false,
      freeShippingReason: null,
      subtotalAmount,
      totalAmount: subtotalAmount,
      error: "No pudimos calcular el envío. Revisá el código postal.",
    };
  }

  const baseShippingAmount = getShippingRateForZone(zone);
  const { free, reason } = qualifiesForFreeShipping(
    freeShipping,
    subtotalAmount,
    input.cartCategoryIds,
  );
  const shippingAmount = free ? 0 : baseShippingAmount;

  return {
    applies: true,
    zone,
    zoneLabel: SHIPPING_ZONE_LABELS[zone],
    baseShippingAmount,
    shippingAmount,
    freeShipping: free,
    freeShippingReason: reason,
    subtotalAmount,
    totalAmount: subtotalAmount + shippingAmount,
    error: null,
  };
}
