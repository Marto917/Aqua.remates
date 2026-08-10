import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { fetchMeliItem, MeliImportError, type MeliImportedItem } from "@/lib/meli-item";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().trim().min(4).max(500),
});

async function ensureCanManage() {
  const session = await getSafeSession();
  return (
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE
  );
}

async function downloadPicture(sourceUrl: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { Accept: "image/*,*/*" },
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 64) return null;
    return await saveCompressedProductImage(buffer);
  } catch (e) {
    console.error("[import-meli] download picture", sourceUrl, e);
    return null;
  }
}

export async function POST(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado. Volvé a iniciar sesión." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pegá el link del artículo de Mercado Libre." },
      { status: 400 },
    );
  }

  try {
    const item = await fetchMeliItem(parsed.data.url);

    const pictures: MeliImportedItem["pictures"] = [];
    for (const pic of item.pictures) {
      const localUrl = await downloadPicture(pic.sourceUrl);
      pictures.push({
        sourceUrl: pic.sourceUrl,
        ...(localUrl ? { localUrl } : {}),
      });
    }

    const mainLocal = pictures.find((p) => p.localUrl)?.localUrl ?? null;

    return NextResponse.json({
      ok: true,
      item: {
        itemId: item.itemId,
        title: item.title,
        description: item.description,
        barcode: item.barcode,
        meliPrice: item.meliPrice,
        permalink: item.permalink,
        status: item.status,
        pictures,
        importedImageUrl: mainLocal,
      },
    });
  } catch (e) {
    if (e instanceof MeliImportError) {
      const status =
        e.code === "missing_token"
          ? 503
          : e.code === "invalid_url"
            ? 400
            : e.code === "not_found"
              ? 404
              : e.code === "forbidden"
                ? 502
                : e.code === "paused"
                  ? 409
                  : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("[import-meli]", e);
    return NextResponse.json(
      { error: "No se pudo importar el artículo de Mercado Libre." },
      { status: 500 },
    );
  }
}
