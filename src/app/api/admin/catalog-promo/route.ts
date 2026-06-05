import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalogPromoSettings } from "@/lib/catalog-promo";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const schema = z.object({
  enabled: z.boolean(),
  badgePercent: z.coerce.number().int().min(1).max(99).nullable(),
  discountPercent: z.coerce.number().int().min(1).max(90).nullable(),
  categoryIds: z.array(z.string().min(1)),
});

export async function GET() {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const settings = await getCatalogPromoSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  if (parsed.data.enabled) {
    if (!parsed.data.discountPercent) {
      return NextResponse.json(
        { error: "Indicá el % de descuento sobre el precio transferencia." },
        { status: 400 },
      );
    }
    if (!parsed.data.badgePercent) {
      return NextResponse.json({ error: "Indicá el % del círculo de descuento." }, { status: 400 });
    }
  }

  await ensureStoreSettings();
  await prisma.storeSettings.update({
    where: { id: "default" },
    data: {
      catalogPromoEnabled: parsed.data.enabled,
      catalogPromoBadgePercent: parsed.data.enabled ? parsed.data.badgePercent : null,
      catalogPromoDiscountPercent: parsed.data.enabled ? parsed.data.discountPercent : null,
      catalogPromoCategoryIds: parsed.data.categoryIds,
    },
  });

  const settings = await getCatalogPromoSettings();
  return NextResponse.json({ ok: true, settings });
}
