"use server";

import { revalidatePath } from "next/cache";
import { RetailOrderStatus } from "@prisma/client";
import { z } from "zod";
import { confirmRetailOrderForCustomer } from "@/lib/confirm-retail-order";
import {
  banCustomer,
  formatBanUntil,
  recordTransferProofRejection,
} from "@/lib/customer-moderation";
import { prisma } from "@/lib/prisma";
import { staffActionErrorMessage } from "@/lib/staff-action-error";
import { requireStaff } from "@/lib/staff-auth";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(RetailOrderStatus),
});

export type TransferReviewResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function updateRetailOrderStatus(formData: FormData) {
  await requireStaff();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return;
  }

  await prisma.retailOrder.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${parsed.data.id}`);
  revalidatePath("/vendedor/pedidos");
  revalidatePath("/vendedor/envios");
}

export async function approveTransferOrder(formData: FormData): Promise<TransferReviewResult> {
  try {
    await requireStaff();
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { ok: false, error: "Pedido inválido." };
    }

    const order = await prisma.retailOrder.findUnique({ where: { id } });
    if (!order || order.paymentMethod !== "BANK_TRANSFER") {
      return { ok: false, error: "No es un pedido por transferencia." };
    }
    if (order.status !== "TRANSFER_REPORTED" && order.status !== "PENDING_TRANSFER") {
      return { ok: false, error: "El pedido no está pendiente de aprobación." };
    }

    await confirmRetailOrderForCustomer(id);

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath("/vendedor/pedidos");
    revalidatePath("/vendedor/envios");
    revalidatePath("/cuenta/mis-compras");

    return { ok: true };
  } catch (e) {
    console.error("approveTransferOrder:", e);
    return { ok: false, error: staffActionErrorMessage(e) };
  }
}

export async function rejectTransferOrder(formData: FormData): Promise<TransferReviewResult> {
  try {
    await requireStaff();
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { ok: false, error: "Pedido inválido." };
    }

    const banDaysRaw = String(formData.get("banDays") ?? "").trim();
    const banDays = banDaysRaw ? Number(banDaysRaw) : 0;
    const banReason = String(formData.get("banReason") ?? "").trim() || null;

    const order = await prisma.retailOrder.findUnique({ where: { id } });
    if (!order || order.paymentMethod !== "BANK_TRANSFER") {
      return { ok: false, error: "No es un pedido por transferencia." };
    }

    await prisma.retailOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    let rejectCount: number | null = null;
    let bannedUntil: Date | null = null;

    if (order.customerId) {
      rejectCount = await recordTransferProofRejection(order.customerId);
      if (Number.isFinite(banDays) && banDays > 0) {
        const ban = await banCustomer({
          userId: order.customerId,
          days: banDays,
          reason: banReason,
        });
        bannedUntil = ban.bannedUntil;
      }
    }

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath("/admin/usuarios");
    revalidatePath("/vendedor/pedidos");
    revalidatePath("/cuenta/mis-compras");

    let message = "Pedido cancelado. Se registró el rechazo del comprobante.";
    if (rejectCount != null) {
      message += ` Rechazos del cliente: ${rejectCount}.`;
    }
    if (bannedUntil) {
      message += ` Cuenta suspendida hasta ${bannedUntil.toLocaleString("es-AR")}.`;
    }

    return { ok: true, message };
  } catch (e) {
    console.error("rejectTransferOrder:", e);
    return { ok: false, error: staffActionErrorMessage(e) };
  }
}

export async function banCustomerFromOrder(formData: FormData): Promise<TransferReviewResult> {
  try {
    await requireStaff();
    const orderId = String(formData.get("id") ?? "");
    const banDays = Number(formData.get("banDays") ?? 0);
    const banReason = String(formData.get("banReason") ?? "").trim() || null;
    if (!orderId || !Number.isFinite(banDays) || banDays < 1) {
      return { ok: false, error: "Datos de suspensión inválidos." };
    }

    const order = await prisma.retailOrder.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });
    if (!order?.customerId) {
      return { ok: false, error: "El pedido no tiene cuenta de cliente asociada." };
    }

    const { bannedUntil } = await banCustomer({
      userId: order.customerId,
      days: banDays,
      reason: banReason,
    });

    revalidatePath(`/admin/pedidos/${orderId}`);
    revalidatePath("/admin/usuarios");

    return {
      ok: true,
      message: `Cuenta suspendida hasta ${formatBanUntil(bannedUntil)}.`,
    };
  } catch (e) {
    console.error("banCustomerFromOrder:", e);
    return { ok: false, error: staffActionErrorMessage(e) };
  }
}

export type DeleteRetailOrderResult = { ok: true } | { ok: false; error: string };

/** Solo el dueño (mail = DEFAULT_OWNER_EMAIL) puede borrar pedidos. */
export async function deleteRetailOrderAsOwner(formData: FormData): Promise<DeleteRetailOrderResult> {
  try {
    const ctx = await requireStaff();
    if (!canOwnerDeleteRetailOrders(ctx.session)) {
      return { ok: false, error: "Solo el dueño puede borrar pedidos." };
    }

    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return { ok: false, error: "Pedido inválido." };
    }

    const existing = await prisma.retailOrder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "Pedido no encontrado." };
    }

    await prisma.$transaction([
      prisma.retailOrderItem.deleteMany({ where: { orderId: id } }),
      prisma.retailOrder.delete({ where: { id } }),
    ]);

    revalidatePath("/admin/pedidos");
    revalidatePath("/vendedor/pedidos");
    revalidatePath("/vendedor/envios");
    revalidatePath("/cuenta/mis-compras");
    return { ok: true };
  } catch (e) {
    console.error("deleteRetailOrderAsOwner:", e);
    return { ok: false, error: staffActionErrorMessage(e) };
  }
}
