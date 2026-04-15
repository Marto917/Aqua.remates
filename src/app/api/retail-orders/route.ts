import { NextResponse } from "next/server";
import { z } from "zod";
import { BANK_TRANSFER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const retailOrderSchema = z.object({
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().positive(),
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const payload = Object.fromEntries(formData.entries());
  const parsed = retailOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  await prisma.retailOrder.create({
    data: {
      buyerName: parsed.data.buyerName,
      buyerEmail: parsed.data.buyerEmail,
      buyerPhone: parsed.data.buyerPhone,
      notes: parsed.data.notes,
      totalAmount: parsed.data.totalAmount,
      transferAlias: BANK_TRANSFER.alias,
      transferCbu: BANK_TRANSFER.cbu,
    },
  });

  return NextResponse.redirect(new URL("/checkout?success=1", req.url));
}
