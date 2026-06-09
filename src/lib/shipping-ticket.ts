import type { RetailShippingMethod, WholesaleRequestStatus } from "@prisma/client";
import { formatArs } from "@/lib/currency";
import {
  retailOrderStatusLabel,
  retailShippingMethodLabel,
  wholesaleRequestStatusLabel,
} from "@/lib/order-labels";
import {
  formatCustomerComments,
  resolveRiderDeliveryAddress,
  type CustomerDefaultShipping,
  type ShippingQrPayload,
} from "@/lib/shipping";

export type ShippingTicketData = {
  orderType: "retail" | "wholesale";
  orderId: string;
  buyerName: string;
  buyerPhone: string | null;
  buyerEmail: string;
  shippingMethod: RetailShippingMethod;
  shippingMethodLabel: string;
  fullAddress: string;
  postalCode: string | null;
  customerComments: string;
  statusLabel: string;
  createdAtLabel: string;
  totalLabel: string;
  itemCount: number;
  lookupApiPath: string;
  assignedRiderNumber: number | null;
  assignedRiderName: string | null;
};

export type AssignedRiderSnapshot = {
  id: string;
  riderNumber: number;
  name: string;
};

type RetailOrderForTicket = {
  id: string;
  buyerName: string;
  buyerPhone: string | null;
  buyerEmail: string;
  shippingMethod: RetailShippingMethod;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  shippingNotes: string | null;
  notes: string | null;
  status: keyof typeof retailOrderStatusLabel;
  createdAt: Date;
  totalAmount: { toString(): string };
  items: unknown[];
  customer?: CustomerDefaultShipping | null;
  assignedRiderId?: string | null;
  assignedRider?: AssignedRiderSnapshot | null;
};

function retailDeliveryAddress(order: RetailOrderForTicket): string {
  return resolveRiderDeliveryAddress(order, order.customer ?? null);
}

export function buildRetailTicketData(order: RetailOrderForTicket): ShippingTicketData {
  const fullAddress = retailDeliveryAddress(order);
  return {
    orderType: "retail",
    orderId: order.id,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    buyerEmail: order.buyerEmail,
    shippingMethod: order.shippingMethod,
    shippingMethodLabel: retailShippingMethodLabel[order.shippingMethod],
    fullAddress,
    postalCode: order.shippingPostalCode,
    customerComments: formatCustomerComments({
      shippingNotes: order.shippingNotes,
      notes: order.notes,
    }),
    statusLabel: retailOrderStatusLabel[order.status],
    createdAtLabel: order.createdAt.toLocaleString("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    totalLabel: formatArs(Number(order.totalAmount)),
    itemCount: order.items.length,
    lookupApiPath: `/api/shipping/orders/${order.id}?type=retail`,
    assignedRiderNumber: order.assignedRider?.riderNumber ?? null,
    assignedRiderName: order.assignedRider?.name ?? null,
  };
}

export function retailOrderToQrPayload(
  order: RetailOrderForTicket,
  options?: { ridersAppEnabled?: boolean },
): ShippingQrPayload | null {
  const ridersOn = options?.ridersAppEnabled !== false;
  if (order.shippingMethod === "DELIVERY" && ridersOn && !order.assignedRider) {
    return null;
  }

  const address = retailDeliveryAddress(order);
  return {
    v: 1,
    type: "retail",
    orderId: order.id,
    buyerName: order.buyerName,
    phone: order.buyerPhone,
    email: order.buyerEmail,
    shippingMethod: order.shippingMethod,
    address,
    fullAddress: address,
    direccion: address,
    postalCode: order.shippingPostalCode,
    riderNumber: order.assignedRider?.riderNumber ?? null,
    riderId: order.assignedRider?.id ?? null,
  };
}

type WholesaleRequestForTicket = {
  id: string;
  contactName: string;
  phone: string | null;
  email: string;
  companyName: string;
  shippingMethod: RetailShippingMethod;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  shippingNotes: string | null;
  notes: string | null;
  status: WholesaleRequestStatus;
  createdAt: Date;
  items: unknown[];
};

export function buildWholesaleTicketData(
  request: WholesaleRequestForTicket,
  totalAmount: number,
): ShippingTicketData {
  const fullAddress = resolveRiderDeliveryAddress(request);
  return {
    orderType: "wholesale",
    orderId: request.id,
    buyerName: `${request.contactName} (${request.companyName})`,
    buyerPhone: request.phone,
    buyerEmail: request.email,
    shippingMethod: request.shippingMethod,
    shippingMethodLabel: retailShippingMethodLabel[request.shippingMethod],
    fullAddress,
    postalCode: request.shippingPostalCode,
    customerComments: formatCustomerComments({
      shippingNotes: request.shippingNotes,
      notes: request.notes,
    }),
    statusLabel: wholesaleRequestStatusLabel[request.status],
    createdAtLabel: request.createdAt.toLocaleString("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    totalLabel: formatArs(totalAmount),
    itemCount: request.items.length,
    lookupApiPath: `/api/shipping/orders/${request.id}?type=wholesale`,
    assignedRiderNumber: null,
    assignedRiderName: null,
  };
}

export function wholesaleRequestToQrPayload(request: WholesaleRequestForTicket): ShippingQrPayload {
  const address = resolveRiderDeliveryAddress(request);
  return {
    v: 1,
    type: "wholesale",
    orderId: request.id,
    buyerName: request.contactName,
    phone: request.phone,
    email: request.email,
    shippingMethod: request.shippingMethod,
    address,
    fullAddress: address,
    direccion: address,
    postalCode: request.shippingPostalCode,
    riderNumber: null,
    riderId: null,
  };
}
