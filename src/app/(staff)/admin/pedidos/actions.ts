"use server";

import { revalidatePath } from "next/cache";
import { RetailOrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(RetailOrderStatus),
});

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

export async function approveTransferOrder(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const order = await prisma.retailOrder.findUnique({ where: { id } });
  if (!order || order.paymentMethod !== "BANK_TRANSFER") return;
  if (order.status !== "TRANSFER_REPORTED" && order.status !== "PENDING_TRANSFER") {
    return;
  }

  await prisma.retailOrder.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/vendedor/pedidos");
  revalidatePath("/vendedor/envios");
}

export async function rejectTransferOrder(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const order = await prisma.retailOrder.findUnique({ where: { id } });
  if (!order || order.paymentMethod !== "BANK_TRANSFER") return;

  await prisma.retailOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/vendedor/pedidos");
}
