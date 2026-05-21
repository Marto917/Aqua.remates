import { getFinalUnitPrice, type PriceMode } from "@/lib/catalog-pricing";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePriceModeForProduct,
  quantityByProductId,
} from "@/lib/wholesale-pricing";

export type RetailCheckoutLineInput = {
  variantId: string;
  productId: string;
  quantity: number;
};

export type ResolvedRetailLine = {
  variantId: string;
  productId: string;
  productName: string;
  variantColorLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ResolvedRetailCart = {
  lines: ResolvedRetailLine[];
  totalAmount: number;
};

export async function resolveRetailCartLines(
  inputs: RetailCheckoutLineInput[],
  mode: PriceMode,
): Promise<{ ok: true; cart: ResolvedRetailCart } | { ok: false; error: string }> {
  if (inputs.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }

  const variantIds = [...new Set(inputs.map((l) => l.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const qtyRows = inputs.map((l) => ({ productId: l.productId, quantity: l.quantity }));
  const totalsByProduct = quantityByProductId(qtyRows);

  const lines: ResolvedRetailLine[] = [];
  let totalAmount = 0;

  for (const input of inputs) {
    const variant = byId.get(input.variantId);
    if (!variant || !variant.product.isActive) {
      return { ok: false, error: "Hay productos no disponibles en el carrito." };
    }
    if (variant.productId !== input.productId) {
      return { ok: false, error: "Datos del carrito inconsistentes." };
    }
    if (input.quantity < 1) {
      return { ok: false, error: "Cantidad inválida." };
    }

    const eff = getEffectivePriceModeForProduct(mode, input.productId, totalsByProduct);
    const unitPrice = getFinalUnitPrice(
      {
        retailPrice: Number(variant.product.retailPrice),
        wholesalePrice: Number(variant.product.wholesalePrice),
        discountRetailPercent: variant.product.discountRetailPercent,
        discountWholesalePercent: variant.product.discountWholesalePercent,
      },
      eff,
    );
    const subtotal = unitPrice * input.quantity;
    totalAmount += subtotal;
    lines.push({
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantColorLabel: variant.colorLabel,
      quantity: input.quantity,
      unitPrice,
      subtotal,
    });
  }

  if (totalAmount <= 0) {
    return { ok: false, error: "El total del pedido debe ser mayor a cero." };
  }

  return { ok: true, cart: { lines, totalAmount } };
}
