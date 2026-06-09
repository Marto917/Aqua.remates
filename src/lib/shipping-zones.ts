export const SHIPPING_RATES_ARS = {
  CABA: 6000,
  PBA: 10_000,
  OUTSIDE: 20_000,
} as const;

export type ShippingZone = keyof typeof SHIPPING_RATES_ARS;

export const SHIPPING_ZONE_LABELS: Record<ShippingZone, string> = {
  CABA: "Capital Federal",
  PBA: "Provincia de Buenos Aires",
  OUTSIDE: "Fuera de Buenos Aires",
};

/** Rangos de CP numéricos asociados a Provincia de Buenos Aires (sin CABA). */
const PBA_POSTAL_RANGES: [number, number][] = [
  [1600, 1999],
  [2700, 2999],
  [6000, 6999],
  [7000, 7999],
  [8000, 8187],
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function parsePostalCode(postalCode: string): number | null {
  const digits = postalCode.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const cp = Number.parseInt(digits.slice(0, 4), 10);
  return Number.isFinite(cp) ? cp : null;
}

function isCabaProvince(province: string): boolean {
  const p = normalizeText(province);
  return (
    p.includes("capital federal") ||
    p === "caba" ||
    p.includes("ciudad autonoma") ||
    p.includes("c.a.b.a")
  );
}

function isPbaProvince(province: string): boolean {
  const p = normalizeText(province);
  if (isCabaProvince(province)) return false;
  return (
    p === "buenos aires" ||
    p.includes("provincia de buenos aires") ||
    p === "pba" ||
    p.includes("gran buenos aires") ||
    p === "gba"
  );
}

function isInRanges(cp: number, ranges: [number, number][]): boolean {
  return ranges.some(([min, max]) => cp >= min && cp <= max);
}

/** Detecta zona de envío según código postal (y provincia como respaldo). */
export function detectShippingZone(
  postalCode: string,
  province?: string | null,
): ShippingZone | null {
  const cp = parsePostalCode(postalCode);
  const prov = province?.trim() ?? "";

  if (cp != null && cp >= 1000 && cp <= 1439) {
    return "CABA";
  }

  if (prov && isCabaProvince(prov)) {
    return "CABA";
  }

  if (cp != null && isInRanges(cp, PBA_POSTAL_RANGES)) {
    return "PBA";
  }

  if (prov && isPbaProvince(prov)) {
    return "PBA";
  }

  if (cp != null) {
    return "OUTSIDE";
  }

  if (prov) {
    if (isCabaProvince(prov)) return "CABA";
    if (isPbaProvince(prov)) return "PBA";
    return "OUTSIDE";
  }

  return null;
}

export function getShippingRateForZone(zone: ShippingZone): number {
  return SHIPPING_RATES_ARS[zone];
}
