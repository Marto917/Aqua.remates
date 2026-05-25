import { NextResponse } from "next/server";
import { z } from "zod";
import { categorySlugFromName } from "@/lib/categories";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2).max(40),
});

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre inválido." }, { status: 400 });
  }

  const name = parsed.data.name.toLowerCase();
  const slug = categorySlugFromName(name);

  try {
    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "La categoría ya existe." }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
  }

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Hay ${count} productos en esta categoría. Reasignalos antes de borrar.` },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/** Migra cocina → bazar y herramientas → ferretería. */
export async function PATCH() {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const bazar = await prisma.category.upsert({
    where: { slug: "bazar" },
    update: {},
    create: { name: "bazar", slug: "bazar" },
  });
  const ferreteria = await prisma.category.upsert({
    where: { slug: "ferreteria" },
    update: {},
    create: { name: "ferreteria", slug: "ferreteria" },
  });

  const cocina = await prisma.category.findFirst({ where: { slug: "cocina" } });
  const herramientas = await prisma.category.findFirst({ where: { slug: "herramientas" } });

  let movedCocina = 0;
  let movedHerramientas = 0;

  if (cocina) {
    const r = await prisma.product.updateMany({
      where: { categoryId: cocina.id },
      data: { categoryId: bazar.id },
    });
    movedCocina = r.count;
    await prisma.category.delete({ where: { id: cocina.id } }).catch(() => undefined);
  }

  if (herramientas) {
    const r = await prisma.product.updateMany({
      where: { categoryId: herramientas.id },
      data: { categoryId: ferreteria.id },
    });
    movedHerramientas = r.count;
    await prisma.category.delete({ where: { id: herramientas.id } }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, movedCocina, movedHerramientas });
}
