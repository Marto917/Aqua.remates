/** Exige calle con número (altura) para envíos a domicilio. */
export function shippingAddressHasStreetNumber(address: string): boolean {
  const line = address.trim();
  if (line.length < 6) return false;
  return /\d/.test(line);
}

export function isValidStreetNumber(streetNumber: string): boolean {
  const n = streetNumber.trim();
  return /^\d+[a-zA-Z]?$/.test(n);
}

export function buildShippingAddressLine(street: string, streetNumber: string): string {
  return `${street.trim()} ${streetNumber.trim()}`.trim();
}

/** Separa "Av. Corrientes 1234" en calle y número. */
export function parseAddressLine(line: string): { street: string; number: string } {
  const trimmed = line.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
  if (match) {
    return { street: match[1].trim(), number: match[2] };
  }
  return { street: trimmed, number: "" };
}

export function formatAddressLine(street: string, streetNumber: string): string {
  const s = street.trim();
  const n = streetNumber.trim();
  if (!s) return "";
  return n ? `${s} ${n}` : s;
}

export function validateShippingAddressLine(line: string): string | null {
  const { street, number } = parseAddressLine(line);
  if (!street.trim()) return "Indicá la calle y el número.";
  if (!number) return "Falta el número de casa (ej: Av. Corrientes 1234).";
  if (!isValidStreetNumber(number)) return "El número debe ser solo dígitos (ej: 1234).";
  const full = buildShippingAddressLine(street, number);
  if (!shippingAddressHasStreetNumber(full)) {
    return "La dirección debe incluir calle y número.";
  }
  return null;
}

export const SHIPPING_ADDRESS_HINT =
  "Escribí calle y número juntos (ej: San Martín 1234). Podés elegir una sugerencia o completar a mano.";
