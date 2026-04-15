import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateAvailabilitySchema = z.object({
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || ![UserRole.OWNER, UserRole.EMPLOYEE].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const payload = Object.fromEntries(formData.entries());
  const parsed = updateAvailabilitySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return NextResponse.redirect(new URL("/admin/productos", req.url));
}
