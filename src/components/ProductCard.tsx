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
import { resolveProductImageUrl } from "@/lib/product-images";

type GalleryImage = {
  imageUrl: string;
  imagePosition?: string | null;
  imageScale?: unknown;
};

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
      images?: GalleryImage[];
    }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const settings = useStoreSettings();
  const colors = product.variants.slice(0, 6);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(colors[0]?.id ?? "");
  const [galleryIndex, setGalleryIndex] = useState(0);

  const selectedVariant = useMemo(
    () => colors.find((variant) => variant.id === selectedVariantId) ?? colors[0],
    [colors, selectedVariantId],
  );

  const galleryImages = useMemo(() => {
    const mainUrl = selectedVariant?.imageUrl || product.imageUrl;
    const main: GalleryImage = {
      imageUrl: mainUrl,
      imagePosition: selectedVariant?.imagePosition ?? product.imagePosition,
      imageScale: selectedVariant?.imageScale ?? product.imageScale,
    };
    const extras = (selectedVariant?.images ?? []).filter((g) => g.imageUrl);
    const all = [main, ...extras];
    const seen = new Set<string>();
    return all.filter((img) => {
      if (seen.has(img.imageUrl)) return false;
      seen.add(img.imageUrl);
      return true;
    });
  }, [selectedVariant, product]);

  const displayName = useMemo(() => formatDisplayWords(product.name), [product.name]);
  const shortDesc = useMemo(() => formatDisplayWords(product.description), [product.description]);
  const safeGalleryIndex =
    galleryImages.length === 0 ? 0 : Math.min(galleryIndex, galleryImages.length - 1);
  const active = galleryImages[safeGalleryIndex] ?? galleryImages[0];
  const imagePosition = active?.imagePosition ?? product.imagePosition;
  const imageScale = Number(active?.imageScale ?? product.imageScale ?? 1);
  const promo = getProductPromoDisplay(product, settings.catalogPromo);
  const freeShipping = getProductFreeShippingDisplay(product.categoryId, settings.freeShipping);
  const hasGallery = galleryImages.length > 1;

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function prev(e: React.MouseEvent) {
    stop(e);
    setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }

  function next(e: React.MouseEvent) {
    stop(e);
    setGalleryIndex((i) => (i + 1) % galleryImages.length);
  }

  function selectVariant(id: string) {
    setSelectedVariantId(id);
    setGalleryIndex(0);
  }

  return (
    <article className="group flex flex-col bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-slate-200/80">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          <ProductImage
            src={resolveProductImageUrl(active?.imageUrl || product.imageUrl)}
            alt={displayName}
            position={imagePosition}
            scale={imageScale}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </Link>
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton productId={product.id} />
        </div>
        {promo.showBadge && promo.badgePercent ? (
          <div
            className="absolute left-2 top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-center text-xs font-bold leading-tight text-white shadow-md"
            aria-label={`${promo.badgePercent}% de descuento`}
          >
            -{promo.badgePercent}%
          </div>
        ) : null}
        {freeShipping ? <FreeShippingBadge display={freeShipping} /> : null}
        {hasGallery ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow opacity-90 hover:opacity-100"
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow opacity-90 hover:opacity-100"
              aria-label="Foto siguiente"
            >
              ›
            </button>
            <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
              {galleryImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full ${
                    idx === safeGalleryIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Link href={`/product/${product.slug}`} className="block">
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
                  selectVariant(v.id);
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
