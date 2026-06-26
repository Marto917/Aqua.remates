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

/** true = credenciales de prueba (Railway: MERCADOPAGO_SANDBOX=true) */
export function isMercadoPagoSandbox(): boolean {
  const flag = process.env.MERCADOPAGO_SANDBOX?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return getAccessToken().startsWith("TEST-");
}

function splitPayerName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "Cliente", surname: "AQUA" };
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

function resolveInitPoint(response: {
  init_point?: string | null;
  sandbox_init_point?: string | null;
}): string {
  const sandbox = isMercadoPagoSandbox();
  const point = sandbox
    ? (response.sandbox_init_point ?? response.init_point)
    : (response.init_point ?? response.sandbox_init_point);
  if (!point) {
    throw new Error("Mercado Pago no devolvió URL de pago.");
  }
  return point;
}

export async function createCheckoutPreference(params: {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  lines: ResolvedRetailLine[];
  shippingAmount?: number;
  totalAmount: number;
}): Promise<{ preferenceId: string; initPoint: string; sandbox: boolean }> {
  const base = getAppBaseUrl();
  const sandbox = isMercadoPagoSandbox();
  const preferenceApi = new Preference(getClient());
  const { name, surname } = splitPayerName(params.buyerName);

  const items = params.lines.map((line) => ({
    id: line.variantId.slice(0, 256),
    title: `${line.productName} — ${line.variantColorLabel}`.slice(0, 256),
    quantity: line.quantity,
    unit_price: Math.round(line.unitPrice * 100) / 100,
    currency_id: "ARS" as const,
  }));

  if (params.shippingAmount != null && params.shippingAmount > 0) {
    items.push({
      id: "shipping",
      title: "Envío a domicilio",
      quantity: 1,
      unit_price: Math.round(params.shippingAmount * 100) / 100,
      currency_id: "ARS",
    });
  }

  const body: Parameters<Preference["create"]>[0]["body"] = {
    items,
    payer: {
      email: params.buyerEmail,
      name,
      surname,
    },
    external_reference: params.orderId,
    back_urls: {
      success: `${base}/checkout/exito`,
      failure: `${base}/checkout/error`,
      pending: `${base}/checkout/pendiente`,
    },
    auto_return: "approved",
    notification_url: `${base}/api/webhooks/mercadopago`,
    statement_descriptor: "AQUA REMATES",
    ...(sandbox
      ? {
          // Evita que el vendedor logueado pague con su propio saldo (CPT01 en pruebas).
          payment_methods: {
            excluded_payment_types: [{ id: "account_money" }],
          },
        }
      : {}),
  };

  let response;
  try {
    response = await preferenceApi.create({ body });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Mercado Pago preference create:", msg);
    throw new Error(`Mercado Pago rechazó la preferencia: ${msg}`);
  }

  const preferenceId = response.id;
  const initPoint = resolveInitPoint(response);
  if (!preferenceId) {
    throw new Error("Mercado Pago no devolvió ID de preferencia.");
  }

  return { preferenceId, initPoint, sandbox };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const paymentApi = new Payment(getClient());
  return paymentApi.get({ id: paymentId });
}
