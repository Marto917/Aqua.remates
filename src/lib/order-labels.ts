import type {
  ApprovalStatus,
  RetailOrderStatus,
  RetailPaymentMethod,
  RetailShippingMethod,
  WholesaleLeadStatus,
  WholesaleRequestStatus,
} from "@prisma/client";

export const retailOrderStatusLabel: Record<RetailOrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago (Mercado Pago)",
  PENDING_TRANSFER: "Pendiente de transferencia",
  TRANSFER_REPORTED: "Comprobante informado",
  PAYMENT_APPROVED: "Pago aprobado (Mercado Pago)",
  CONFIRMED: "Confirmado / listo",
  CANCELLED: "Cancelado",
};

export const retailPaymentMethodLabel: Record<RetailPaymentMethod, string> = {
  BANK_TRANSFER: "Transferencia bancaria",
  MERCADO_PAGO: "Mercado Pago",
};

export const retailShippingMethodLabel: Record<RetailShippingMethod, string> = {
  PICKUP: "Retiro en sucursal",
  DELIVERY: "Envío a domicilio",
  SHIPPING_TO_COORDINATE: "Envío a coordinar",
};

export const wholesaleRequestStatusLabel: Record<WholesaleRequestStatus, string> = {
  PENDIENTE_CONFIRMACION: "Pendiente de confirmación (vendedor)",
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
  CONFIRMADO: "Confirmado por vendedor",
  RECHAZADO: "Rechazado",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
};

export const wholesaleLeadStatusLabel: Record<WholesaleLeadStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  CERRADO: "Cerrado",
  DESCARTADO: "Descartado",
};

export const approvalStatusLabel: Record<ApprovalStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};
