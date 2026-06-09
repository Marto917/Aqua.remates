"use client";

import { useMemo, useState } from "react";
import { FreeShippingBadge } from "@/components/FreeShippingBadge";
import { ProductImage } from "@/components/ProductImage";
import { ProductPriceBlock } from "@/components/ProductPriceBlock";
import { useCart } from "@/contexts/cart-context";
import { useStoreSettings } from "@/contexts/store-settings-context";
import { swatchColorForLabel } from "@/lib/color-swatch";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";
import { getProductFreeShippingDisplay } from "@/lib/free-shipping";
import { getListPrice, getTransferPrice } from "@/lib/store-pricing";

type VariantImage = {
  imageUrl: string;
  imagePosition?: string | null;
  imageScale?: unknown;
};

type Variant = {
  id: string;
  colorLabel: string;
  imageUrl: string | null;
  imagePosition?: string | null;
  imageScale?: unknown;
  gallery?: VariantImage[];
};

type Product = {
  id: string;
  name: string;
  imageUrl: string;
  imagePosition?: string | null;
  imageScale?: unknown;
  listPrice: unknown;
  retailPrice: unknown;
  discountRetailPercent?: number;
  categoryId: string;
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

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-xl text-amber-400" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function ProductAddToCart({
  product,
  variants,
  title,
  categoryLabel,
  shortDescription,
  reviewAverage,
  reviewCount,
}: ProductAddToCartProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addLine, hydrated } = useCart();
  const storeSettings = useStoreSettings();
  const freeShipping = getProductFreeShippingDisplay(
    product.categoryId,
    storeSettings.freeShipping,
  );

  const selected = variants.find((v) => v.id === variantId) ?? variants[0];

  const galleryImages = useMemo(() => {
    if (!selected) return [];
    const main: VariantImage = {
      imageUrl: selected.imageUrl || product.imageUrl,
      imagePosition: selected.imagePosition ?? product.imagePosition,
      imageScale: selected.imageScale ?? product.imageScale,
    };
    const extra = (selected.gallery ?? []).filter((g) => g.imageUrl);
    const all = [main, ...extra];
    const seen = new Set<string>();
    return all.filter((img) => {
      const key = img.imageUrl;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selected, product]);

  const activeImage = galleryImages[galleryIndex] ?? galleryImages[0];
  const displayImage = resolveProductImageUrl(activeImage?.imageUrl || product.imageUrl);
  const imagePosition = activeImage?.imagePosition ?? product.imagePosition;
  const imageScale = Number(activeImage?.imageScale ?? product.imageScale ?? 1);

  const pricing = useMemo(
    () => ({
      listPrice: getListPrice(product),
      transferPrice: getTransferPrice(product),
    }),
    [product],
  );

  if (!selected) {
    return <p className="text-sm text-rose-600">No hay variantes disponibles.</p>;
  }

  function handleVariantChange(id: string) {
    setVariantId(id);
    setGalleryIndex(0);
  }

  function handleAdd() {
    addLine({
      variantId: selected.id,
      productId: product.id,
      productName: title,
      colorLabel: formatDisplayWords(selected.colorLabel),
      imageUrl: resolveProductImageUrl(selected.imageUrl || product.imageUrl),
      listPrice: pricing.listPrice,
      transferPrice: pricing.transferPrice,
      discountPercent: 0,
      quantity: qty,
    });
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50 lg:sticky lg:top-24">
          <ProductImage
            src={displayImage}
            alt={title}
            position={imagePosition}
            scale={imageScale}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        {galleryImages.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {galleryImages.map((img, idx) => (
              <button
                key={`${img.imageUrl}-${idx}`}
                type="button"
                onClick={() => setGalleryIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  galleryIndex === idx ? "border-brand-dark" : "border-slate-200"
                }`}
              >
                <ProductImage
                  src={resolveProductImageUrl(img.imageUrl)}
                  alt=""
                  position={img.imagePosition}
                  scale={Number(img.imageScale ?? 1)}
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        ) : null}
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
                Leer las {reviewCount} calificaciones
              </a>
            </>
          ) : (
            <a href="#opiniones-producto" className="text-brand-dark underline">
              Sé el primero en calificar
            </a>
          )}
        </div>

        <ProductPriceBlock product={product} size="detail" showMercadoPago />

        {freeShipping ? (
          <FreeShippingBadge display={freeShipping} variant="inline" />
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Color</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isPicked = v.id === variantId;
              const bg = swatchColorForLabel(v.colorLabel);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVariantChange(v.id)}
                  title={formatDisplayWords(v.colorLabel)}
                  aria-label={`Color ${formatDisplayWords(v.colorLabel)}`}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
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
          disabled={!hydrated}
          onClick={handleAdd}
          className={`w-full rounded-md py-4 text-base font-bold uppercase tracking-wide text-white shadow-md transition disabled:opacity-60 ${
            added ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand hover:bg-brand-dark"
          }`}
        >
          {!hydrated ? "Cargando carrito…" : added ? "✓ Agregado al carrito" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
