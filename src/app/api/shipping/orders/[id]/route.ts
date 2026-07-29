import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import {
  formatCustomerComments,
  resolveRiderDeliveryAddress,
} from "@/lib/shipping";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";

const querySchema = z.object({
  type: z.enum(["retail", "wholesale"]).default("retail"),
});

type LookupAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function checkLookupAuth(req: Request): LookupAuthResult {
  const secret = process.env.SHIPPING_LOOKUP_KEY?.trim();
  if (!secret) {
    // Fail-closed: sin clave no se expone PII de pedidos (antes quedaba abierto).
    return {
      ok: false,
      status: 503,
      error:
        "Consulta de envíos no disponible. Configurá SHIPPING_LOOKUP_KEY en el servidor.",
    };
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ") && header.slice(7) === secret) {
    return { ok: true };
  }
  const apiKey = req.headers.get("x-shipping-key");
  if (apiKey === secret) {
    return { ok: true };
  }
  return { ok: false, status: 401, error: "No autorizado." };
}

/**
 * Consulta ligera para apps externas (el QR incluye orderId + dirección).
 * Siempre exige SHIPPING_LOOKUP_KEY + Authorization: Bearer <key> o header X-Shipping-Key.
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = checkLookupAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
        deliveryStatus: true,
        deliveryDispatchedAt: true,
        deliveryDeliveredAt: true,
        createdAt: true,
        customer: {
          select: {
            defaultShippingAddress: true,
            defaultShippingCity: true,
            defaultShippingProvince: true,
            defaultShippingPostalCode: true,
          },
        },
        assignedRider: {
          select: { id: true, riderNumber: true, name: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    const deliveryAddress = resolveRiderDeliveryAddress(order, order.customer);
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
      address: deliveryAddress,
      fullAddress: deliveryAddress,
      direccion: deliveryAddress,
      postalCode: order.shippingPostalCode,
      riderNumber: order.assignedRider?.riderNumber ?? null,
      riderId: order.assignedRider?.id ?? null,
      riderName: order.assignedRider?.name ?? null,
      customerComments: formatCustomerComments({
        shippingNotes: order.shippingNotes,
        notes: order.notes,
      }),
      deliveryStatus: order.deliveryStatus,
      deliveryStatusLabel: deliveryDispatchStatusLabel(order.deliveryStatus),
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
      deliveryStatus: true,
      deliveryDispatchedAt: true,
      deliveryDeliveredAt: true,
      createdAt: true,
    },
  });
  if (!request) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  const deliveryAddress = resolveRiderDeliveryAddress(request);
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
    address: deliveryAddress,
    fullAddress: deliveryAddress,
    direccion: deliveryAddress,
    postalCode: request.shippingPostalCode,
    customerComments: formatCustomerComments({
      shippingNotes: request.shippingNotes,
      notes: request.notes,
    }),
    deliveryStatus: request.deliveryStatus,
    deliveryStatusLabel: deliveryDispatchStatusLabel(request.deliveryStatus),
    createdAt: request.createdAt.toISOString(),
  });
}
