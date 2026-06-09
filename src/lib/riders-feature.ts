import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function isRidersAppEnabled(): Promise<boolean> {
  try {
    const row = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { ridersAppEnabled: true },
    });
    return row?.ridersAppEnabled ?? false;
  } catch {
    return false;
  }
}

export function ridersAppDisabledResponse() {
  return NextResponse.json(
    { error: "La app de repartidores está desactivada en la tienda." },
    { status: 503 },
  );
}
