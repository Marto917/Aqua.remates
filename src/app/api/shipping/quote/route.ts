import { NextResponse } from "next/server";
import { z } from "zod";
import { getFreeShippingSettings } from "@/lib/free-shipping";
import { resolveRetailCartLines } from "@/lib/retail-cart";
import { resolveShippingQuote } from "@/lib/shipping-quote";

const lineSchema = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const schema = z.object({
  paymentMethod: z.enum(["BANK_TRANSFER", "MERCADO_PAGO"]),
  shippingMethod: z.enum(["PICKUP", "DELIVERY", "SHIPPING_TO_COORDINATE"]),
  shippingPostalCode: z.string().optional(),
  shippingProvince: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const resolved = await resolveRetailCartLines(parsed.data.lines, parsed.data.paymentMethod);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const freeShipping = await getFreeShippingSettings();
  const cartCategoryIds = [...new Set(resolved.cart.lines.map((l) => l.categoryId))];

  const quote = await resolveShippingQuote({
    shippingMethod: parsed.data.shippingMethod,
    postalCode: parsed.data.shippingPostalCode,
    province: parsed.data.shippingProvince,
    subtotalAmount: resolved.cart.subtotalAmount,
    cartCategoryIds,
    freeShipping,
  });

  return NextResponse.json({ ok: true, quote });
}
