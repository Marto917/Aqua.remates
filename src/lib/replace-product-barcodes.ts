import { prisma } from "@/lib/prisma";
import {
  type BarcodeInput,
  barcodeMatchKey,
  normalizeBarcode,
} from "@/lib/product-barcodes";

/**
 * Reemplaza los códigos del producto y sincroniza `Product.sku` = primer código.
 * Lanza Error con mensaje legible si el código ya pertenece a otro producto.
 */
export async function replaceProductBarcodes(productId: string, barcodes: BarcodeInput[]) {
  const cleaned = barcodes
    .map((b) => ({
      code: normalizeBarcode(b.code).slice(0, 64),
      label: b.label?.trim().slice(0, 40) || null,
    }))
    .filter((b) => b.code);

  const seen = new Set<string>();
  const unique: typeof cleaned = [];
  for (const b of cleaned) {
    const key = barcodeMatchKey(b.code);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
  }

  for (const b of unique) {
    const onBarcode = await prisma.productBarcode.findUnique({
      where: { code: b.code },
      select: { productId: true },
    });
    if (onBarcode && onBarcode.productId !== productId) {
      throw new Error(`El código "${b.code}" ya está asignado a otro producto.`);
    }

    const onSku = await prisma.product.findFirst({
      where: { sku: b.code, NOT: { id: productId } },
      select: { id: true, name: true },
    });
    if (onSku) {
      throw new Error(`El código "${b.code}" ya está como SKU de otro producto.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.productBarcode.deleteMany({ where: { productId } });
    if (unique.length > 0) {
      await tx.productBarcode.createMany({
        data: unique.map((b, sortOrder) => ({
          productId,
          code: b.code,
          label: b.label,
          sortOrder,
        })),
      });
    }
    await tx.product.update({
      where: { id: productId },
      data: { sku: unique[0]?.code ?? null },
    });
  });

  return unique;
}
