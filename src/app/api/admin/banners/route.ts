import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  placementFromSortOrder,
  sortOrderForPlacement,
  type BannerPlacement,
} from "@/lib/banner-placement";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";

const placementSchema = z.enum(["carousel", "promo"]);

async function ensureCanManage() {
  const session = await getSafeSession();
  return (
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE
  );
}

export async function POST(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí una imagen." }, { status: 400 });
  }

  const placementRaw = String(formData.get("placement") ?? "carousel");
  const placementResult = placementSchema.safeParse(placementRaw);
  if (!placementResult.success) {
    return NextResponse.json({ error: "Ubicación inválida." }, { status: 400 });
  }
  const placement: BannerPlacement = placementResult.data;

  if (placement === "carousel") {
    const carouselCount = await prisma.banner.count({
      where: { sortOrder: { lt: 1000 } },
    });
    if (carouselCount >= 3) {
      return NextResponse.json(
        { error: "El carrusel admite como máximo 3 imágenes." },
        { status: 400 },
      );
    }
  }

  const title = String(formData.get("title") ?? "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const isActive = String(formData.get("isActive") ?? "on") === "on";
  const orderRaw = Number(String(formData.get("sortOrder") ?? "0"));
  const sortOrder = sortOrderForPlacement(placement, orderRaw);

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await saveCompressedProductImage(buffer, { maxSide: 1920 });

  const banner = await prisma.banner.create({
    data: { title, imageUrl, linkUrl, isActive, sortOrder },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      linkUrl: true,
      isActive: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({
    ok: true,
    banner: {
      ...banner,
      placement: placementFromSortOrder(banner.sortOrder),
    },
  });
}

export async function DELETE(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id." }, { status: 400 });
  }
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
