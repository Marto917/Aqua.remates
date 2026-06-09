import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  freeShippingRulesPayload,
  getFreeShippingSettings,
  type FreeShippingCategoryMode,
} from "@/lib/free-shipping";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const amountSchema = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : v),
  z.union([z.coerce.number().int().min(1), z.null()]),
);

const schema = z.object({
  enabled: z.boolean(),
  minOrderEnabled: z.boolean(),
  minOrderAmount: amountSchema,
  categoryFreeEnabled: z.boolean(),
  categoryMode: z.enum(["all", "selected"]),
  categoryIds: z.array(z.string().min(1)),
});

function isMissingColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /column .* does not exist/i.test(msg) || /Unknown field .*freeShipping/i.test(msg);
}

export async function GET() {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const settings = await getFreeShippingSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("[free-shipping GET]", e);
    return NextResponse.json({ error: "No se pudieron cargar los datos." }, { status: 500 });
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
    if (!parsed.data.minOrderEnabled && !parsed.data.categoryFreeEnabled) {
      return NextResponse.json(
        { error: "Activá al menos una regla de envío gratis (monto mínimo o categorías)." },
        { status: 400 },
      );
    }
    if (parsed.data.minOrderEnabled && parsed.data.minOrderAmount == null) {
      return NextResponse.json({ error: "Indicá el monto mínimo para envío gratis." }, { status: 400 });
    }
    if (
      parsed.data.categoryFreeEnabled &&
      parsed.data.categoryMode === "selected" &&
      parsed.data.categoryIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Elegí al menos una categoría para envío gratis." },
        { status: 400 },
      );
    }
  }

  const mode = parsed.data.categoryMode as FreeShippingCategoryMode;
  const settingsPayload = {
    enabled: parsed.data.enabled,
    minOrderEnabled: parsed.data.minOrderEnabled,
    minOrderAmount: parsed.data.minOrderEnabled ? parsed.data.minOrderAmount : null,
    categoryFreeEnabled: parsed.data.categoryFreeEnabled,
    categoryMode: mode,
    categoryIds: mode === "selected" ? parsed.data.categoryIds : [],
  };

  try {
    await ensureStoreSettings();
    await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        freeShippingRules: parsed.data.enabled
          ? freeShippingRulesPayload(settingsPayload)
          : Prisma.DbNull,
      },
    });

    const settings = await getFreeShippingSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("[free-shipping POST]", e);
    if (isMissingColumnError(e)) {
      return NextResponse.json(
        { error: "Falta actualizar la base de datos. Ejecutá: npm run db:migrate" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
