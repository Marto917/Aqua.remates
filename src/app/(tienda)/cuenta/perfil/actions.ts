"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function updatePhoneAction(formData: FormData) {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    redirect("/login?callbackUrl=/cuenta/perfil");
  }

  const phone = String(formData.get("phone") ?? "").trim();
  if (phone.length < 8) {
    redirect("/cuenta/perfil?error=phone");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone },
  });

  revalidatePath("/cuenta/perfil");
  revalidatePath("/checkout");
}
