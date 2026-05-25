"use client";

import { useMemo, useState } from "react";
import { Suspense } from "react";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import { useCart } from "@/contexts/cart-context";
import { useSearchParams } from "next/navigation";
import type { PriceMode } from "@/lib/catalog-pricing";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";
import { getEffectivePriceModeForProduct, quantityByProductId } from "@/lib/wholesale-pricing";

type Variant = {
  id: string;
  colorLabel: string;
  imageUrl: string | null;
  imagePosition?: string | null;
};

type Product = {
  id: string;
  name: string;
  imageUrl: string;
  imagePosition?: string | null;
  listPrice: unknown;
  retailPrice: unknown;
  wholesalePrice: unknown;
  discountRetailPercent: number;
  discountWholesalePercent: number;
};

type ProductAddToCartProps = {
  product: Product;
  variants: Variant[];
  title: string;
  categoryLabel: string;
};

function ProductAddToCartInner({ product, variants, title, categoryLabel }: ProductAddToCartProps) {
  const searchParams = useSearchParams();
  const priceMode: PriceMode = searchParams.get("priceMode") === "wholesale" ? "wholesale" : "retail";

  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const { addLine, mode, lines } = useCart();

  const selected = variants.find((v) => v.id === variantId) ?? variants[0];
  const displayImage = resolveProductImageUrl(selected?.imageUrl || product.imageUrl);
  const imagePosition = selected?.imagePosition ?? product.imagePosition;

  const totalUnitsThisProduct = useMemo(() => {
    const forProduct = lines.filter((l) => l.productId === product.id);
    const sum = forProduct.reduce((a, l) => a + l.quantity, 0);
    const line = forProduct.find((l) => l.variantId === variantId);
    if (line) return sum - line.quantity + qty;
    return sum + qty;
  }, [lines, product.id, variantId, qty]);

  const previewTotals = useMemo(() => {
    const m = quantityByProductId(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
    m.set(product.id, totalUnitsThisProduct);
    return m;
  }, [lines, product.id, totalUnitsThisProduct]);

  const effectiveMode: PriceMode = getEffectivePriceModeForProduct(mode, product.id, previewTotals);
  const displayMode = priceMode === "wholesale" ? effectiveMode : "retail";

  const retail = Number(product.retailPrice);
  const wholesale = Number(product.wholesalePrice);
  const dr = product.discountRetailPercent;
  const dw = product.discountWholesalePercent;

  if (!selected) {
    return <p className="text-sm text-rose-600">No hay variantes disponibles.</p>;
  }

  return (
    <div className="space-y-5">
      <span className="inline-block rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark">
        {categoryLabel}
      </span>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>

      <ProductPriceBlock product={product} mode={displayMode} size="detail" />

      <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-xl bg-slate-100">
        <ProductImage
          src={displayImage}
          alt={title}
          position={imagePosition}
          sizes="(max-width: 768px) 100vw, 512px"
          priority
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Color</p>
        <div className="flex flex-wrap items-center gap-3">
          {variants.map((v) => {
            const bg = swatchColorForLabel(v.colorLabel);
            const isPicked = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                title={formatDisplayWords(v.colorLabel)}
                aria-label={`Elegir color ${formatDisplayWords(v.colorLabel)}`}
                className={`relative h-10 w-10 shrink-0 rounded-full border-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] transition ${
                  isPicked
                    ? "border-brand-dark ring-2 ring-brand/50 ring-offset-2"
                    : "border-slate-200 hover:border-slate-400"
                }`}
                style={{ backgroundColor: bg }}
              />
            );
          })}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Seleccionado:{" "}
          <span className="font-medium text-slate-900">
            {formatDisplayWords(selected.colorLabel)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Cantidad
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-center text-base"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => {
          addLine({
            variantId: selected.id,
            productId: product.id,
            productName: title,
            colorLabel: formatDisplayWords(selected.colorLabel),
            imageUrl: displayImage,
            retailPrice: retail,
            wholesalePrice: wholesale,
            discountRetailPercent: dr,
            discountWholesalePercent: dw,
            quantity: qty,
          });
          setQty(1);
        }}
        className="w-full max-w-md rounded-full bg-brand py-4 text-base font-semibold text-white shadow-md hover:bg-brand-dark"
      >
        Agregar al carrito
      </button>
    </div>
  );
}

export function ProductAddToCart(props: ProductAddToCartProps) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Cargando producto…</p>}>
      <ProductAddToCartInner {...props} />
    </Suspense>
  );
}
