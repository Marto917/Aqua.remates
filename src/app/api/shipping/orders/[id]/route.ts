import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatCustomerComments, formatFullAddress } from "@/lib/shipping";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";

const querySchema = z.object({
  type: z.enum(["retail", "wholesale"]).default("retail"),
});

function checkLookupAuth(req: Request): boolean {
  const secret = process.env.SHIPPING_LOOKUP_KEY?.trim();
  if (!secret) {
    return true;
  }
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7) === secret;
  }
  const apiKey = req.headers.get("x-shipping-key");
  return apiKey === secret;
}

/**
 * Consulta ligera para apps externas (el QR incluye orderId + dirección).
 * Si SHIPPING_LOOKUP_KEY está definida, exige Authorization: Bearer <key> o header X-Shipping-Key.
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!checkLookupAuth(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ type: url.searchParams.get("type") ?? "retail" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetro type inválido." }, { status: 400 });
  }

  if (parsed.data.type === "retail") {
    const order = await prisma.retailOrder.findUnique({
      where: { id },
      select: {
        id: true,
        buyerName: true,
        buyerPhone: true,
        buyerEmail: true,
        shippingMethod: true,
        shippingAddress: true,
        shippingCity: true,
        shippingProvince: true,
        shippingPostalCode: true,
        shippingNotes: true,
        notes: true,
        status: true,
        createdAt: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    return NextResponse.json({
      v: 1,
      type: "retail",
      orderId: order.id,
      buyerName: order.buyerName,
      phone: order.buyerPhone,
      email: order.buyerEmail,
      shippingMethod: order.shippingMethod,
      shippingMethodLabel: retailShippingMethodLabel[order.shippingMethod],
      status: order.status,
      statusLabel: retailOrderStatusLabel[order.status],
      fullAddress: formatFullAddress(order),
      postalCode: order.shippingPostalCode,
      customerComments: formatCustomerComments({
        shippingNotes: order.shippingNotes,
        notes: order.notes,
      }),
      createdAt: order.createdAt.toISOString(),
    });
  }

  const request = await prisma.wholesaleRequest.findUnique({
    where: { id },
    select: {
      id: true,
      contactName: true,
      phone: true,
      email: true,
      companyName: true,
      shippingMethod: true,
      shippingAddress: true,
      shippingCity: true,
      shippingProvince: true,
      shippingPostalCode: true,
      shippingNotes: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  });
  if (!request) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    v: 1,
    type: "wholesale",
    orderId: request.id,
    buyerName: request.contactName,
    companyName: request.companyName,
    phone: request.phone,
    email: request.email,
    shippingMethod: request.shippingMethod,
    shippingMethodLabel: retailShippingMethodLabel[request.shippingMethod],
    status: request.status,
    fullAddress: formatFullAddress(request),
    postalCode: request.shippingPostalCode,
    customerComments: formatCustomerComments({
      shippingNotes: request.shippingNotes,
      notes: request.notes,
    }),
    createdAt: request.createdAt.toISOString(),
  });
}
