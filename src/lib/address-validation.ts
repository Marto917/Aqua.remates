/** Exige calle con número (altura) para envíos a domicilio. */
export function shippingAddressHasStreetNumber(address: string): boolean {
  const line = address.trim();
  if (line.length < 6) return false;
  return /\d/.test(line);
}

export const SHIPPING_ADDRESS_HINT =
  "Indicá calle y número (ej: Av. Corrientes 1234). Solo el nombre de la calle no alcanza.";
