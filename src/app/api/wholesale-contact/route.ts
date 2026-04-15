import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const wholesaleSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  requestedInfo: z.string().min(10),
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const payload = Object.fromEntries(formData.entries());
  const parsed = wholesaleSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  await prisma.wholesaleLead.create({
    data: parsed.data,
  });

  return NextResponse.redirect(new URL("/mayorista/contacto?success=1", req.url));
}
