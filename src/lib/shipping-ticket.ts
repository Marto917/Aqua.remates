import type { RetailShippingMethod, WholesaleRequestStatus } from "@prisma/client";
import { formatArs } from "@/lib/currency";
import {
  retailOrderStatusLabel,
  retailShippingMethodLabel,
  wholesaleRequestStatusLabel,
} from "@/lib/order-labels";
import {
  formatCustomerComments,
  formatFullAddress,
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
  qrDataUrl: string;
  lookupApiPath: string;
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
};

export function buildRetailTicketData(
  order: RetailOrderForTicket,
  qrDataUrl: string,
): ShippingTicketData {
  const fullAddress = formatFullAddress(order);
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
    qrDataUrl,
    lookupApiPath: `/api/shipping/orders/${order.id}?type=retail`,
  };
}

export function retailOrderToQrPayload(order: RetailOrderForTicket): ShippingQrPayload {
  return {
    v: 1,
    type: "retail",
    orderId: order.id,
    buyerName: order.buyerName,
    phone: order.buyerPhone,
    address: formatFullAddress(order),
    postalCode: order.shippingPostalCode,
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
  qrDataUrl: string,
): ShippingTicketData {
  const fullAddress = formatFullAddress(request);
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
    qrDataUrl,
    lookupApiPath: `/api/shipping/orders/${request.id}?type=wholesale`,
  };
}

export function wholesaleRequestToQrPayload(request: WholesaleRequestForTicket): ShippingQrPayload {
  return {
    v: 1,
    type: "wholesale",
    orderId: request.id,
    buyerName: request.contactName,
    phone: request.phone,
    address: formatFullAddress(request),
    postalCode: request.shippingPostalCode,
  };
}
