"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getListingPriceLabel,
  type PriceMode,
} from "@/lib/catalog-pricing";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import {
  DEFAULT_PRODUCT_IMAGE,
  ERROR_PRODUCT_IMAGE,
  resolveProductImageUrl,
} from "@/lib/product-images";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
    category: { name: string };
    variants: { id: string; colorLabel: string; imageUrl?: string | null }[];
  };
  mode: PriceMode;
};

export function ProductCard({ product, mode }: ProductCardProps) {
  const { main, hint } = getListingPriceLabel(product, mode);
  const colors = product.variants.slice(0, 6);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(colors[0]?.id ?? "");

  const selectedVariant = useMemo(
    () => colors.find((variant) => variant.id === selectedVariantId) ?? colors[0],
    [colors, selectedVariantId],
  );
  const baseResolved = useMemo(
    () => resolveProductImageUrl(selectedVariant?.imageUrl || product.imageUrl),
    [selectedVariant, product.imageUrl],
  );
  const [imgSrc, setImgSrc] = useState(baseResolved);
  useEffect(() => {
    setImgSrc(baseResolved);
  }, [baseResolved]);

  const displayName = useMemo(() => formatDisplayWords(product.name), [product.name]);
  const displayDesc = useMemo(() => formatDisplayWords(product.description), [product.description]);
  const displayCategory = useMemo(() => formatDisplayWords(product.category.name), [product.category.name]);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative h-32 w-full bg-slate-100 sm:h-40 lg:h-44">
          <Image
            src={imgSrc}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={imgSrc === DEFAULT_PRODUCT_IMAGE || imgSrc === ERROR_PRODUCT_IMAGE}
            onError={() => {
              setImgSrc((u) => (u === DEFAULT_PRODUCT_IMAGE ? u : DEFAULT_PRODUCT_IMAGE));
            }}
          />
        </div>
        <div className="space-y-1.5 p-3 sm:space-y-2 sm:p-4">
          <span className="inline-flex rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {displayCategory}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">{displayName}</h3>
          <p className="line-clamp-2 text-xs text-slate-600 sm:text-sm">{displayDesc}</p>
          <p className="text-base font-bold text-brand-dark sm:text-lg">{main}</p>
          {hint ? <p className="text-[11px] leading-tight text-slate-500">{hint}</p> : null}
        </div>
      </Link>
      {colors.length > 0 && (
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
      )}
    </article>
  );
}
