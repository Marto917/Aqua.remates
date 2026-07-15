import { NextResponse } from "next/server";
import { z } from "zod";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";
import { getShippingRates } from "@/lib/shipping-zones";

const schema = z.object({
  shippingRateCaba: z.coerce.number().int().min(0).max(1_000_000),
  shippingRatePba: z.coerce.number().int().min(0).max(1_000_000),
  shippingRateOutside: z.coerce.number().int().min(0).max(1_000_000),
});

export async function GET() {
  const rates = await getShippingRates();
  return NextResponse.json({ ok: true, rates });
}

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá montos válidos (enteros ≥ 0)." }, { status: 400 });
  }

  await ensureStoreSettings();
  await prisma.storeSettings.update({
    where: { id: "default" },
    data: {
      shippingRateCaba: parsed.data.shippingRateCaba,
      shippingRatePba: parsed.data.shippingRatePba,
      shippingRateOutside: parsed.data.shippingRateOutside,
    },
  });

  const rates = await getShippingRates();
  return NextResponse.json({ ok: true, rates });
}
