import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvEscape(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function money(value: { toString(): string } | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(2);
}

/**
 * Exportación liviana (solo texto CSV) para importar artículos en un POS / Excel.
 * Una fila por código de barra (si un producto tiene varios, se repite el artículo).
 */
export async function GET() {
  try {
    const session = await getSafeSession();
    const allowed =
      isBackofficePreview() ||
      session?.user.role === UserRole.OWNER ||
      session?.user.role === UserRole.EMPLOYEE;

    if (!allowed) {
      return NextResponse.json({ error: "No autorizado. Volvé a iniciar sesión." }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        barcodes: { orderBy: { sortOrder: "asc" }, select: { code: true, label: true } },
      },
      orderBy: [{ name: "asc" }, { updatedAt: "desc" }],
    });

    const header = [
      "codigo",
      "nombre",
      "precio",
      "precio_mayorista",
      "categoria",
      "proveedor",
      "activo",
      "sku_principal",
      "nota_codigo",
    ];

    const lines: string[] = [header.join(";")];

    for (const p of products) {
      const codes =
        p.barcodes.length > 0
          ? p.barcodes.map((b) => ({ code: b.code, label: b.label ?? "" }))
          : p.sku?.trim()
            ? [{ code: p.sku.trim(), label: "" }]
            : [{ code: "", label: "" }];

      for (const b of codes) {
        lines.push(
          [
            csvEscape(b.code),
            csvEscape(p.name),
            money(p.listPrice),
            money(p.wholesalePrice),
            csvEscape(p.category.name),
            csvEscape(p.supplierName?.trim() || ""),
            p.isActive ? "1" : "0",
            csvEscape(p.sku?.trim() || codes[0]?.code || ""),
            csvEscape(b.label),
          ].join(";"),
        );
      }
    }

    // BOM UTF-8 para que Excel / varios POS abran bien tildes
    const body = `\uFEFF${lines.join("\r\n")}\r\n`;
    const filename = `aqua-articulos-pos-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export-catalog-text]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo generar el archivo de texto del catálogo.",
      },
      { status: 500 },
    );
  }
}
