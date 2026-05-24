import { randomInt } from "crypto";

/** Código numérico de 4 dígitos para confirmar entrega con el cliente. */
export function generateDeliveryCode(): string {
  return String(randomInt(1000, 10000));
}

export function normalizeDeliveryCodeInput(input: string): string {
  return input.replace(/\D/g, "").slice(0, 4);
}

export function deliveryCodesMatch(stored: string, input: string): boolean {
  return stored === normalizeDeliveryCodeInput(input);
}
