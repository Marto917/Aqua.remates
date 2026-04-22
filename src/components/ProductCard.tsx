"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getListingPriceLabel,
  type PriceMode,
} from "@/lib/catalog";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { resolveProductImageUrl } from "@/lib/product-images";

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
  const imageSrc = resolveProductImageUrl(selectedVariant?.imageUrl || product.imageUrl);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative h-44 w-full bg-slate-100">
          <Image src={imageSrc} alt={product.name} fill className="object-cover" />
        </div>
        <div className="space-y-2 p-4">
          <span className="inline-flex rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {product.category.name}
          </span>
          <h3 className="font-semibold leading-snug text-slate-900">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
          <p className="text-lg font-bold text-brand-dark">{main}</p>
          {hint ? <p className="text-[11px] leading-tight text-slate-500">{hint}</p> : null}
        </div>
      </Link>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {colors.map((v) => (
            <button
              key={v.id}
              type="button"
              title={v.colorLabel}
              aria-label={`Ver ${product.name} en color ${v.colorLabel}`}
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
