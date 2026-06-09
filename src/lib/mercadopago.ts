import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getAppBaseUrl } from "@/lib/app-url";
import type { ResolvedRetailLine } from "@/lib/retail-cart";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  }
  return token;
}

function getClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getAccessToken() });
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export async function createCheckoutPreference(params: {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  lines: ResolvedRetailLine[];
  shippingAmount?: number;
  totalAmount: number;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const base = getAppBaseUrl();
  const preferenceApi = new Preference(getClient());

  const items = params.lines.map((line) => ({
    id: line.variantId,
    title: `${line.productName} — ${line.variantColorLabel}`.slice(0, 256),
    quantity: line.quantity,
    unit_price: line.unitPrice,
    currency_id: "ARS",
  }));

  if (params.shippingAmount != null && params.shippingAmount > 0) {
    items.push({
      id: "shipping",
      title: "Envío a domicilio",
      quantity: 1,
      unit_price: params.shippingAmount,
      currency_id: "ARS",
    });
  }

  const response = await preferenceApi.create({
    body: {
      items,
      payer: { email: params.buyerEmail, name: params.buyerName },
      external_reference: params.orderId,
      back_urls: {
        success: `${base}/checkout/exito`,
        failure: `${base}/checkout/error`,
        pending: `${base}/checkout/pendiente`,
      },
      auto_return: "approved",
      notification_url: `${base}/api/webhooks/mercadopago`,
      statement_descriptor: "AQUA REMATES",
    },
  });

  const preferenceId = response.id;
  const initPoint = response.init_point ?? response.sandbox_init_point;
  if (!preferenceId || !initPoint) {
    throw new Error("Mercado Pago no devolvió URL de pago.");
  }

  return { preferenceId, initPoint };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const paymentApi = new Payment(getClient());
  return paymentApi.get({ id: paymentId });
}
