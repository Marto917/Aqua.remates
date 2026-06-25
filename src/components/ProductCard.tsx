"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FreeShippingBadge } from "@/components/FreeShippingBadge";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import { WishlistButton } from "@/components/WishlistButton";
import { useStoreSettings } from "@/contexts/store-settings-context";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import { getProductFreeShippingDisplay } from "@/lib/free-shipping";
import { getProductPromoDisplay } from "@/lib/product-promo";

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
    categoryId: string;
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
  const promo = getProductPromoDisplay(product, settings.catalogPromo);
  const freeShipping = getProductFreeShippingDisplay(product.categoryId, settings.freeShipping);

  return (
    <article className="group flex flex-col bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-slate-200/80">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
          <ProductImage
            src={selectedVariant?.imageUrl || product.imageUrl}
            alt={displayName}
            position={imagePosition}
            scale={imageScale}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          <div className="absolute right-2 top-2 z-10">
            <WishlistButton productId={product.id} />
          </div>
          {promo.showBadge && promo.badgePercent ? (
            <div
              className="absolute left-2 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-center text-xs font-bold leading-tight text-white shadow-md"
              aria-label={`${promo.badgePercent}% de descuento`}
            >
              {promo.badgePercent}%
              <br />
              OFF
            </div>
          ) : null}
          {freeShipping ? <FreeShippingBadge display={freeShipping} /> : null}
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
            <ProductPriceBlock product={product} size="card" />
          </div>
        </div>
      </Link>
    </article>
  );
}
