import type { ApprovalStatus, RetailOrderStatus, WholesaleLeadStatus, WholesaleRequestStatus } from "@prisma/client";

export const retailOrderStatusLabel: Record<RetailOrderStatus, string> = {
  PENDING_TRANSFER: "Pendiente de transferencia",
  TRANSFER_REPORTED: "Comprobante informado",
  CONFIRMED: "Confirmado / cobrado",
  CANCELLED: "Cancelado",
};

export const wholesaleRequestStatusLabel: Record<WholesaleRequestStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
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
