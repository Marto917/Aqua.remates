"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import { useStoreSettings } from "@/contexts/store-settings-context";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import {
  getDiscountBadgeLabel,
  shouldShowDiscountBadge,
} from "@/lib/product-pricing-display";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    imagePosition?: string | null;
    imageScale?: unknown;
    listPrice: unknown;
    retailPrice: unknown;
    discountRetailPercent: number;
    discountBadgeLabel?: string | null;
    variants: {
      id: string;
      colorLabel: string;
      imageUrl?: string | null;
      imagePosition?: string | null;
      imageScale?: unknown;
    }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const settings = useStoreSettings();
  const colors = product.variants.slice(0, 6);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(colors[0]?.id ?? "");

  const selectedVariant = useMemo(
    () => colors.find((variant) => variant.id === selectedVariantId) ?? colors[0],
    [colors, selectedVariantId],
  );

  const displayName = useMemo(() => formatDisplayWords(product.name), [product.name]);
  const shortDesc = useMemo(() => formatDisplayWords(product.description), [product.description]);
  const imagePosition = selectedVariant?.imagePosition ?? product.imagePosition;
  const imageScale = Number(selectedVariant?.imageScale ?? product.imageScale ?? 1);
  const showBadge = shouldShowDiscountBadge(product.discountRetailPercent);
  const badgeLabel = getDiscountBadgeLabel(product, settings);

  return (
    <article className="group flex flex-col bg-white transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
          <ProductImage
            src={selectedVariant?.imageUrl || product.imageUrl}
            alt={displayName}
            position={imagePosition}
            scale={imageScale}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          {showBadge ? (
            <span className="absolute right-1 top-1 flex min-h-[3.5rem] min-w-[3.5rem] max-w-[5.5rem] items-center justify-center rounded-full bg-brand px-2 py-1 text-center text-[9px] font-bold uppercase leading-tight text-white shadow-md sm:min-h-16 sm:min-w-16 sm:text-[10px]">
              {badgeLabel}
            </span>
          ) : null}
        </div>

        {colors.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5 px-2 py-2.5">
            {colors.map((v) => (
              <button
                key={v.id}
                type="button"
                title={formatDisplayWords(v.colorLabel)}
                aria-label={`Color ${formatDisplayWords(v.colorLabel)}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantId(v.id);
                }}
                className={`h-5 w-5 rounded-full border-2 shadow-sm transition ${
                  selectedVariant?.id === v.id
                    ? "border-brand-dark ring-2 ring-brand/40 ring-offset-1"
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
            <ProductPriceBlock product={product} settings={settings} size="card" />
          </div>
        </div>
      </Link>
    </article>
  );
}
