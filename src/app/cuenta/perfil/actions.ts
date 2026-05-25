"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function updateProfileImageAction(formData: FormData) {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    redirect("/login?callbackUrl=/cuenta/perfil");
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { imageUrl: imageUrl || null },
  });

  revalidatePath("/cuenta/perfil");
  revalidatePath("/", "layout");
}
