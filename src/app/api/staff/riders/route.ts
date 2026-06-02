import { NextResponse } from "next/server";
import { formatRiderNumber } from "@/lib/rider-number";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

/** Lista de repartidores activos para asignar viajes (vendedor / staff). */
export async function GET() {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const riders = await prisma.rider.findMany({
    where: { isActive: true },
    orderBy: { riderNumber: "asc" },
    select: {
      id: true,
      riderNumber: true,
      name: true,
      phone: true,
    },
  });

  return NextResponse.json({
    riders: riders.map((r) => ({
      ...r,
      label: `${formatRiderNumber(r.riderNumber)} — ${r.name}`,
    })),
  });
}
