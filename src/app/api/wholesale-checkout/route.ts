import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { resolveRetailCartLines } from "@/lib/retail-cart";
import { logWholesaleRequestEvent } from "@/lib/wholesale-events";

const lineSchema = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const checkoutSchema = z
  .object({
    companyName: z.string().min(2),
    cuit: z.string().min(8),
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    shippingMethod: z.enum(["PICKUP", "SHIPPING_TO_COORDINATE"]),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingProvince: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingNotes: z.string().optional(),
    lines: z.array(lineSchema).min(1),
  });

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tenés que iniciar sesión para pedir como mayorista." }, { status: 401 });
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ error: "Esta compra es solo para clientes registrados." }, { status: 403 });
  }
  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Verificá tu email antes de enviar el pedido mayorista." },
      { status: 403 },
    );
  }

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
  const resolved = await resolveRetailCartLines(data.lines, "wholesale");
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const { cart } = resolved;

  const request = await prisma.wholesaleRequest.create({
    data: {
      status: "PENDIENTE_CONFIRMACION",
      customerId: session.user.id,
      companyName: data.companyName.trim(),
      cuit: data.cuit.trim(),
      contactName: data.contactName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      shippingMethod: data.shippingMethod,
      shippingAddress: data.shippingAddress?.trim() || null,
      shippingCity: data.shippingCity?.trim() || null,
      shippingProvince: data.shippingProvince?.trim() || null,
      shippingPostalCode: data.shippingPostalCode?.trim() || null,
      shippingNotes: data.shippingNotes?.trim() || null,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productNameSnapshot: line.productName,
          colorLabelSnapshot: line.variantColorLabel,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          subtotal: line.subtotal,
        })),
      },
    },
  });

  await logWholesaleRequestEvent(request.id, session.user.id, "CART_SUBMITTED", {
    totalAmount: cart.totalAmount,
    itemCount: cart.lines.length,
  });

  return NextResponse.json({
    requestId: request.id,
    totalAmount: cart.totalAmount,
  });
}
