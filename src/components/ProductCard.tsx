"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import type { PriceMode } from "@/lib/catalog-pricing";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import { MIN_UNITS_FOR_WHOLESALE_PRICE } from "@/lib/pricing-constants";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    imagePosition?: string | null;
    listPrice: unknown;
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
    category: { name: string };
    variants: {
      id: string;
      colorLabel: string;
      imageUrl?: string | null;
      imagePosition?: string | null;
    }[];
  };
  mode: PriceMode;
};

export function ProductCard({ product, mode }: ProductCardProps) {
  const colors = product.variants.slice(0, 6);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(colors[0]?.id ?? "");

  const selectedVariant = useMemo(
    () => colors.find((variant) => variant.id === selectedVariantId) ?? colors[0],
    [colors, selectedVariantId],
  );

  const displayName = useMemo(() => formatDisplayWords(product.name), [product.name]);
  const displayCategory = useMemo(() => formatDisplayWords(product.category.name), [product.category.name]);
  const imagePosition = selectedVariant?.imagePosition ?? product.imagePosition;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-slate-100">
          <ProductImage
            src={selectedVariant?.imageUrl || product.imageUrl}
            alt={displayName}
            position={imagePosition}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>
        <div className="space-y-2 p-3 sm:p-4">
          <span className="inline-flex rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {displayCategory}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
            {displayName}
          </h3>
          <ProductPriceBlock product={product} mode={mode} size="card" />
          {mode === "wholesale" ? (
            <p className="text-[11px] leading-tight text-slate-500">
              Precio mayorista con {MIN_UNITS_FOR_WHOLESALE_PRICE}+ unidades del mismo producto.
            </p>
          ) : null}
        </div>
      </Link>
      {colors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3 sm:px-4 sm:pb-4">
          {colors.map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.colorLabel}
              aria-label={`Ver ${displayName} en color ${formatDisplayWords(v.colorLabel)}`}
              onClick={() => setSelectedVariantId(v.id)}
              className={`h-5 w-5 rounded-full border-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] transition ${
                selectedVariant?.id === v.id
                  ? "border-brand-dark ring-2 ring-brand/50 ring-offset-1"
                  : "border-slate-200 hover:border-slate-400"
              }`}
              style={{ backgroundColor: swatchColorForLabel(v.colorLabel) }}
            >
              <span className="sr-only">{v.colorLabel}</span>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
