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

export const SHIPPING_ADDRESS_HINT =
  "El número de casa es obligatorio (ej: 1234). Sin número la app de reparto no puede tomar el pedido.";
