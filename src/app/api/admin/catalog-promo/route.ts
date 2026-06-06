import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalogPromoSettings } from "@/lib/catalog-promo";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const nullablePercent = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : v),
  z.union([z.coerce.number().int().min(1).max(99), z.null()]),
);

const nullableDiscount = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : v),
  z.union([z.coerce.number().int().min(1).max(90), z.null()]),
);

const schema = z.object({
  enabled: z.boolean(),
  badgePercent: nullablePercent,
  discountPercent: nullableDiscount,
  categoryIds: z.array(z.string().min(1)),
});

function isMissingColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /column .* does not exist/i.test(msg) || /Unknown field .*catalogPromo/i.test(msg);
}

export async function GET() {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const settings = await getCatalogPromoSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("[catalog-promo GET]", e);
    return NextResponse.json(
      {
        error: isMissingColumnError(e)
          ? "Falta actualizar la base de datos. Ejecutá: npm run db:migrate"
          : "No se pudieron cargar los datos de promo.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (parsed.data.enabled) {
    if (parsed.data.discountPercent == null) {
      return NextResponse.json(
        { error: "Indicá el % de descuento sobre el precio transferencia." },
        { status: 400 },
      );
    }
    if (parsed.data.badgePercent == null) {
      return NextResponse.json({ error: "Indicá el % del círculo de descuento." }, { status: 400 });
    }
  }

  try {
    await ensureStoreSettings();
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        catalogPromoEnabled: parsed.data.enabled,
        catalogPromoBadgePercent: parsed.data.enabled ? parsed.data.badgePercent : null,
        catalogPromoDiscountPercent: parsed.data.enabled ? parsed.data.discountPercent : null,
        catalogPromoCategoryIds:
          parsed.data.categoryIds.length > 0 ? parsed.data.categoryIds : [],
      },
    });

    const settings = await getCatalogPromoSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("[catalog-promo POST]", e);
    if (isMissingColumnError(e)) {
      return NextResponse.json(
        {
          error:
            "La base de datos no está actualizada. En Railway o local ejecutá: npm run db:migrate",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "No se pudo guardar la promo." }, { status: 500 });
  }
}
