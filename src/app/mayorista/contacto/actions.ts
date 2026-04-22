"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const wholesaleSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  taxId: z.string().optional(),
  estimatedVolume: z.string().optional(),
  message: z.string().min(10)
});

export async function createWholesaleLead(formData: FormData) {
  const parsed = wholesaleSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    taxId: formData.get("taxId"),
    estimatedVolume: formData.get("estimatedVolume"),
    message: formData.get("message")
  });

  if (!parsed.success) {
    redirect("/mayorista/contacto?error=1");
  }

  await prisma.wholesaleLead.create({ data: parsed.data });

  // Punto de extension: enviar email/notificacion a equipo comercial.
  redirect("/mayorista/contacto?success=1");
}
