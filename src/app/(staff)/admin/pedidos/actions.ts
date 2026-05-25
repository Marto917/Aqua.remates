"use server";

import { revalidatePath } from "next/cache";
import { RetailOrderStatus } from "@prisma/client";
import { z } from "zod";
import { confirmRetailOrderForCustomer } from "@/lib/confirm-retail-order";
import { prisma } from "@/lib/prisma";
import { staffActionErrorMessage } from "@/lib/staff-action-error";
import { requireStaff } from "@/lib/staff-auth";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(RetailOrderStatus),
});

export type TransferReviewResult = { ok: true } | { ok: false; error: string };

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

    const order = await prisma.retailOrder.findUnique({ where: { id } });
    if (!order || order.paymentMethod !== "BANK_TRANSFER") {
      return { ok: false, error: "No es un pedido por transferencia." };
    }

    await prisma.retailOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath("/vendedor/pedidos");

    return { ok: true };
  } catch (e) {
    console.error("rejectTransferOrder:", e);
    return { ok: false, error: staffActionErrorMessage(e) };
  }
}
