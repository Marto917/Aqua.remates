"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import type { PriceMode } from "@/lib/catalog-pricing";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import { retailDiscountBadgePercent } from "@/lib/product-pricing-display";
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
  const shortDesc = useMemo(() => formatDisplayWords(product.description), [product.description]);
  const imagePosition = selectedVariant?.imagePosition ?? product.imagePosition;
  const badge =
    mode === "retail" ? retailDiscountBadgePercent(product) : null;

  return (
    <article className="group flex flex-col bg-white transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
          <ProductImage
            src={selectedVariant?.imageUrl || product.imageUrl}
            alt={displayName}
            position={imagePosition}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          {badge != null && badge > 0 ? (
            <span className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-center text-xs font-bold leading-tight text-white shadow-md">
              -{badge}%
            </span>
          ) : null}
        </div>

        {colors.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5 px-2 py-2.5">
            {colors.map((v) => (
              <button
                key={v.id}
                type="button"
                title={v.colorLabel}
                aria-label={`Ver ${displayName} en color ${formatDisplayWords(v.colorLabel)}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantId(v.id);
                }}
                className={`h-4 w-4 rounded-full border shadow-sm transition ${
                  selectedVariant?.id === v.id
                    ? "border-brand-dark ring-1 ring-brand ring-offset-1"
                    : "border-slate-200"
                }`}
                style={{ backgroundColor: swatchColorForLabel(v.colorLabel) }}
              />
            ))}
          </div>
        ) : null}

        <div className="space-y-1 px-2 pb-3 text-center sm:px-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 sm:text-base">
            {displayName}
          </h3>
          <p className="line-clamp-1 text-xs text-slate-500">{shortDesc}</p>
          <div className="pt-1">
            <ProductPriceBlock product={product} mode={mode} size="card" />
          </div>
          {mode === "wholesale" ? (
            <p className="text-[10px] text-slate-500">
              Mayorista · {MIN_UNITS_FOR_WHOLESALE_PRICE}+ unidades
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
