"use client";

import { useMemo, useState } from "react";
import { Suspense } from "react";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import { useCart } from "@/contexts/cart-context";
import { useSearchParams } from "next/navigation";
import type { PriceMode } from "@/lib/catalog-pricing";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";
import { retailDiscountBadgePercent } from "@/lib/product-pricing-display";
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
  shortDescription: string;
  reviewAverage: number | null;
  reviewCount: number;
};

function StarsDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-base" : "text-xl";
  return (
    <span className={`${cls} text-amber-400`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function ProductAddToCartInner({
  product,
  variants,
  title,
  categoryLabel,
  shortDescription,
  reviewAverage,
  reviewCount,
}: ProductAddToCartProps) {
  const searchParams = useSearchParams();
  const priceMode: PriceMode = searchParams.get("priceMode") === "wholesale" ? "wholesale" : "retail";

  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const { addLine, mode, lines } = useCart();

  const selected = variants.find((v) => v.id === variantId) ?? variants[0];
  const displayImage = resolveProductImageUrl(selected?.imageUrl || product.imageUrl);
  const imagePosition = selected?.imagePosition ?? product.imagePosition;
  const badge =
    priceMode === "retail" ? retailDiscountBadgePercent(product) : null;

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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50 lg:sticky lg:top-24">
          <ProductImage
            src={displayImage}
            alt={title}
            position={imagePosition}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          {badge != null && badge > 0 ? (
            <span className="absolute left-3 top-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-lg">
              -{badge}%
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Categoría: <span className="font-medium text-slate-700">{categoryLabel}</span>
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">{categoryLabel}</p>
          <h1 className="mt-1 text-2xl font-bold uppercase tracking-wide text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{shortDescription}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {reviewAverage != null && reviewCount > 0 ? (
            <>
              <StarsDisplay rating={reviewAverage} />
              <span className="font-semibold text-slate-800">{reviewAverage.toFixed(1)}</span>
              <a href="#opiniones-producto" className="text-brand-dark underline">
                Leer las {reviewCount} opiniones
              </a>
            </>
          ) : (
            <a href="#opiniones-producto" className="text-brand-dark underline">
              Sé el primero en opinar
            </a>
          )}
        </div>

        <ProductPriceBlock product={product} mode={displayMode} size="detail" />

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Color</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isPicked = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  title={formatDisplayWords(v.colorLabel)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    isPicked
                      ? "border-brand-dark bg-brand-muted font-semibold text-brand-dark"
                      : "border-slate-200 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {formatDisplayWords(v.colorLabel)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex w-fit items-center gap-3 text-sm font-medium text-slate-800">
          Cantidad
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-md border border-slate-200 px-2 py-2 text-center"
          />
        </label>

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
          className="w-full rounded-md bg-brand py-4 text-base font-bold uppercase tracking-wide text-white shadow-md hover:bg-brand-dark"
        >
          Agregar al carrito
        </button>
      </div>
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
