import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  catalogPromoRulesPayload,
  getCatalogPromoSettings,
  type CatalogPromoMode,
} from "@/lib/catalog-promo";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const percentSchema = z.coerce.number().int().min(1).max(99);

const schema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["global", "byCategory"]),
  globalPercent: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? null : v),
    z.union([percentSchema, z.null()]),
  ),
  categoryPercents: z.record(z.string(), percentSchema),
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

  const mode = parsed.data.mode as CatalogPromoMode;

  if (parsed.data.enabled) {
    if (mode === "global" && parsed.data.globalPercent == null) {
      return NextResponse.json({ error: "Indicá el % de descuento." }, { status: 400 });
    }
    if (mode === "byCategory" && Object.keys(parsed.data.categoryPercents).length === 0) {
      return NextResponse.json(
        { error: "Indicá el % de descuento en al menos una categoría." },
        { status: 400 },
      );
    }
  }

  const settingsPayload = {
    enabled: parsed.data.enabled,
    mode,
    globalPercent: mode === "global" ? parsed.data.globalPercent : null,
    categoryPercents: mode === "byCategory" ? parsed.data.categoryPercents : {},
  };

  try {
    await ensureStoreSettings();
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        catalogPromoEnabled: parsed.data.enabled,
        catalogPromoRules: parsed.data.enabled
          ? catalogPromoRulesPayload(settingsPayload)
          : Prisma.DbNull,
        catalogPromoBadgePercent: null,
        catalogPromoDiscountPercent: null,
        catalogPromoCategoryIds: Prisma.DbNull,
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
