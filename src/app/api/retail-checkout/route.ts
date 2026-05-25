import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { initialDeliveryStatus } from "@/lib/delivery-dispatch";
import { resolveRetailCartLines } from "@/lib/retail-cart";
import { getStoreSettings } from "@/lib/store-settings";

const lineSchema = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const checkoutSchema = z
  .object({
    buyerName: z.string().min(2),
    buyerEmail: z.string().email(),
    buyerPhone: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z.enum(["BANK_TRANSFER", "MERCADO_PAGO"]),
    shippingMethod: z.enum(["PICKUP", "DELIVERY", "SHIPPING_TO_COORDINATE"]),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingProvince: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingNotes: z.string().optional(),
    lines: z.array(lineSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod === "DELIVERY") {
      if (!data.shippingAddress?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá la dirección de envío.", path: ["shippingAddress"] });
      }
      if (!data.shippingCity?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá la ciudad.", path: ["shippingCity"] });
      }
    }
    if (data.paymentMethod === "MERCADO_PAGO" && !isMercadoPagoConfigured()) {
      ctx.addIssue({
        code: "custom",
        message: "Mercado Pago no está configurado en el servidor.",
        path: ["paymentMethod"],
      });
    }
  });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;
  const resolved = await resolveRetailCartLines(data.lines, data.paymentMethod);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const settings = await getStoreSettings();
  const { cart } = resolved;
  const isTransfer = data.paymentMethod === "BANK_TRANSFER";
  const status = isTransfer ? "PENDING_TRANSFER" : "PENDING_PAYMENT";

  const order = await prisma.retailOrder.create({
    data: {
      buyerName: data.buyerName.trim(),
      buyerEmail: data.buyerEmail.trim().toLowerCase(),
      buyerPhone: data.buyerPhone?.trim() || null,
      notes: data.notes?.trim() || null,
      paymentMethod: data.paymentMethod,
      shippingMethod: data.shippingMethod,
      shippingAddress: data.shippingAddress?.trim() || null,
      shippingCity: data.shippingCity?.trim() || null,
      shippingProvince: data.shippingProvince?.trim() || null,
      shippingPostalCode: data.shippingPostalCode?.trim() || null,
      shippingNotes: data.shippingNotes?.trim() || null,
      deliveryStatus: initialDeliveryStatus(data.shippingMethod),
      totalAmount: cart.totalAmount,
      status,
      transferAlias: isTransfer ? settings.bankAlias : null,
      transferCbu: isTransfer ? settings.bankCbu : null,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          variantColorLabel: line.variantColorLabel,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          subtotal: line.subtotal,
        })),
      },
    },
  });

  if (isTransfer) {
    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "BANK_TRANSFER",
      transfer: {
        holder: settings.bankHolder,
        alias: settings.bankAlias,
        cbu: settings.bankCbu,
        notes: settings.bankExtraNotes,
      },
      totalAmount: cart.totalAmount,
    });
  }

  try {
    const { preferenceId, initPoint } = await createCheckoutPreference({
      orderId: order.id,
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      lines: cart.lines,
      totalAmount: cart.totalAmount,
    });

    await prisma.retailOrder.update({
      where: { id: order.id },
      data: { mercadoPagoPreferenceId: preferenceId },
    });

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "MERCADO_PAGO",
      initPoint,
      totalAmount: cart.totalAmount,
    });
  } catch (e) {
    console.error("Mercado Pago preference error:", e);
    await prisma.retailOrder.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(
      { error: "No se pudo iniciar el pago con Mercado Pago. Intentá de nuevo o elegí transferencia." },
      { status: 502 },
    );
  }
}
