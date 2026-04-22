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
}
