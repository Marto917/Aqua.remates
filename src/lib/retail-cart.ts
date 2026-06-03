import { getListPrice, getTransferPrice } from "@/lib/store-pricing";
import { prisma } from "@/lib/prisma";

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
  paymentMethod: "BANK_TRANSFER" | "MERCADO_PAGO",
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

  const lines: ResolvedRetailLine[] = [];
  let totalAmount = 0;

  for (const input of inputs) {
    const variant = byId.get(input.variantId);
    if (!variant || !variant.product.isActive) {
      return { ok: false, error: "Hay productos no disponibles en el carrito." };
    }
    if (
      variant.product.catalogVisibility === "HIDDEN" ||
      variant.product.catalogVisibility === "WHOLESALE_ONLY"
    ) {
      return { ok: false, error: "Hay productos no disponibles para compra minorista." };
    }
    if (variant.productId !== input.productId) {
      return { ok: false, error: "Datos del carrito inconsistentes." };
    }
    if (input.quantity < 1) {
      return { ok: false, error: "Cantidad inválida." };
    }

    const pricing = {
      listPrice: variant.product.listPrice,
      retailPrice: variant.product.retailPrice,
    };

    const unitPrice =
      paymentMethod === "MERCADO_PAGO" ? getListPrice(pricing) : getTransferPrice(pricing);

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
