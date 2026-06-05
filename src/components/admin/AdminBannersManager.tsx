"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { resolveProductImageUrl } from "@/lib/product-images";

const MAX_CAROUSEL = 3;

const CAROUSEL_SPECS = "Recomendado 1920 × 600 px o más (banner ancho)";

type BannerItem = {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  placement: "carousel" | "promo";
};

type Props = {
  initialBanners: BannerItem[];
};

function CarouselPlacementPreview({
  items,
  pendingPreview,
  carouselFull,
  onPickFile,
}: {
  items: BannerItem[];
  pendingPreview: string | null;
  carouselFull: boolean;
  onPickFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextSlot = items.length;

  function openPicker() {
    if (!carouselFull) inputRef.current?.click();
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase text-violet-900">
        Vista carrusel — inicio
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-1 flex gap-0.5 pointer-events-none" aria-hidden>
          <div className="h-2 flex-1 rounded bg-slate-100" />
          <div className="h-2 w-8 rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: MAX_CAROUSEL }, (_, i) => {
            const item = items[i];
            const isNext = i === nextSlot && !carouselFull;
            const showPending = isNext && pendingPreview;

            if (item) {
              return (
                <div
                  key={item.id}
                  className="relative aspect-[16/7] overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                >
                  <Image
                    src={resolveProductImageUrl(item.imageUrl)}
                    alt={item.title ?? `Slide ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[8px] text-white">
                    {i + 1}
                  </span>
                </div>
              );
            }

            if (showPending) {
              return (
                <button
                  key={`pending-${i}`}
                  type="button"
                  onClick={openPicker}
                  className="group relative aspect-[16/7] overflow-hidden rounded-lg border-2 border-violet-400 bg-violet-100"
                  aria-label="Cambiar imagen del carrusel"
                >
                  <Image src={pendingPreview} alt="Vista previa" fill className="object-cover" unoptimized />
                  <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                </button>
              );
            }

            if (isNext) {
              return (
                <button
                  key={`slot-${i}`}
                  type="button"
                  onClick={openPicker}
                  className="group flex aspect-[16/7] items-center justify-center rounded-lg border-2 border-dashed border-violet-400 bg-violet-50 transition hover:border-violet-600 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  aria-label="Subir imagen al carrusel"
                >
                  <span className="px-1 text-center text-[8px] font-bold leading-tight text-violet-800 group-hover:underline">
                    TOCAR PARA
                    <br />
                    SUBIR
                  </span>
                </button>
              );
            }

            return (
              <div
                key={`empty-${i}`}
                className="aspect-[16/7] rounded-lg border border-dashed border-slate-200 bg-slate-50"
                aria-hidden
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-center gap-1 pointer-events-none" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full ${i < items.length ? "w-3 bg-violet-400" : "w-1 bg-slate-200"}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-600">{CAROUSEL_SPECS}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PromoPlacementPreview({
  pendingPreview,
  onPickFile,
}: {
  pendingPreview: string | null;
  onPickFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase text-amber-900">
        Vista promos — debajo del carrusel
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={openPicker}
          className="group relative col-span-2 flex aspect-[2/1] items-center justify-center overflow-hidden rounded-lg border-2 border-amber-400 bg-amber-50 transition hover:border-amber-600 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          aria-label={pendingPreview ? "Cambiar imagen promo" : "Subir imagen promo"}
        >
          {pendingPreview ? (
            <>
              <Image src={pendingPreview} alt="Vista previa promo" fill className="object-cover" unoptimized />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            </>
          ) : (
            <span className="text-[9px] font-bold text-amber-900 group-hover:underline">
              TOCAR PARA SUBIR
            </span>
          )}
        </button>
        <div className="aspect-square rounded bg-slate-100 pointer-events-none" aria-hidden />
        <div className="aspect-square rounded bg-slate-100 pointer-events-none" aria-hidden />
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-600">Cuadrada o apaisada, mín. 600 px de ancho</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function AdminBannersManager({ initialBanners }: Props) {
  const [banners, setBanners] = useState(initialBanners);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carouselPreview, setCarouselPreview] = useState<string | null>(null);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [carouselFile, setCarouselFile] = useState<File | null>(null);
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const carouselFormRef = useRef<HTMLFormElement>(null);
  const promoFormRef = useRef<HTMLFormElement>(null);

  const carouselItems = banners
    .filter((b) => b.placement === "carousel")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const promoItems = banners
    .filter((b) => b.placement === "promo")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const carouselFull = carouselItems.length >= MAX_CAROUSEL;

  function pickCarousel(file: File) {
    if (carouselPreview) URL.revokeObjectURL(carouselPreview);
    setCarouselFile(file);
    setCarouselPreview(URL.createObjectURL(file));
    setError(null);
  }

  function pickPromo(file: File) {
    if (promoPreview) URL.revokeObjectURL(promoPreview);
    setPromoFile(file);
    setPromoPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function submitBanner(
    placement: "carousel" | "promo",
    file: File | null,
    formRef: React.RefObject<HTMLFormElement | null>,
  ) {
    if (!file) {
      setError("Elegí una imagen tocando la vista previa.");
      return;
    }
    if (placement === "carousel" && carouselFull) {
      setError(`El carrusel admite como máximo ${MAX_CAROUSEL} imágenes.`);
      return;
    }

    const fd = new FormData();
    fd.set("placement", placement);
    fd.set("imageFile", file);
    fd.set("sortOrder", String(placement === "carousel" ? carouselItems.length : promoItems.length));
    fd.set("isActive", "on");

    const titleInput = formRef.current?.querySelector<HTMLInputElement>('input[name="title"]');
    const linkInput = formRef.current?.querySelector<HTMLInputElement>('input[name="linkUrl"]');
    if (titleInput?.value.trim()) fd.set("title", titleInput.value.trim());
    if (linkInput?.value.trim()) fd.set("linkUrl", linkInput.value.trim());

    const setSaving = placement === "carousel" ? setSavingCarousel : setSavingPromo;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banners", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string; banner?: BannerItem };
      if (!res.ok || !data.ok || !data.banner) {
        setError(data.error ?? "No se pudo guardar el banner.");
        return;
      }
      setBanners((prev) => [data.banner!, ...prev]);
      if (placement === "carousel") {
        if (carouselPreview) URL.revokeObjectURL(carouselPreview);
        setCarouselPreview(null);
        setCarouselFile(null);
        carouselFormRef.current?.reset();
      } else {
        if (promoPreview) URL.revokeObjectURL(promoPreview);
        setPromoPreview(null);
        setPromoFile(null);
        promoFormRef.current?.reset();
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitCarousel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitBanner("carousel", carouselFile, carouselFormRef);
  }

  async function onSubmitPromo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitBanner("promo", promoFile, promoFormRef);
  }

  async function removeBanner(id: string) {
    if (!confirm("¿Eliminar este banner?")) return;
    const prev = banners;
    setBanners((items) => items.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setBanners(prev);
      setError("No se pudo eliminar el banner.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Carrusel del home</h2>
        <p className="mt-1 text-sm text-slate-600">
          Máximo <strong>{MAX_CAROUSEL} imágenes</strong> en el slider principal. Tocá el recuadro de la vista previa
          para subir cada una.
        </p>

        {carouselFull ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Ya tenés {MAX_CAROUSEL} imágenes en el carrusel. Eliminá una abajo para agregar otra.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <form ref={carouselFormRef} onSubmit={onSubmitCarousel} className="mt-4 space-y-4">
          <CarouselPlacementPreview
            items={carouselItems}
            pendingPreview={carouselPreview}
            carouselFull={carouselFull}
            onPickFile={pickCarousel}
          />

          <input
            name="title"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Título opcional"
          />
          <input
            name="linkUrl"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Link opcional (ej: /catalog)"
          />

          <button
            disabled={savingCarousel || carouselFull || !carouselFile}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            type="submit"
          >
            {savingCarousel ? "Guardando…" : "Subir al carrusel"}
          </button>
        </form>
      </div>

      <BannerList
        title="Carrusel principal"
        subtitle={`${carouselItems.length}/${MAX_CAROUSEL} imágenes en el slider.`}
        items={carouselItems}
        onRemove={removeBanner}
      />

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Promos secundarias</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mosaico debajo del carrusel en el inicio. Tocá la vista previa para subir.
        </p>

        <form ref={promoFormRef} onSubmit={onSubmitPromo} className="mt-4 space-y-4">
          <PromoPlacementPreview pendingPreview={promoPreview} onPickFile={pickPromo} />

          <input
            name="title"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Título opcional"
          />
          <input
            name="linkUrl"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Link opcional"
          />

          <button
            disabled={savingPromo || !promoFile}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            type="submit"
          >
            {savingPromo ? "Guardando…" : "Subir promo"}
          </button>
        </form>
      </div>

      <BannerList
        title="Promos secundarias"
        subtitle="Imágenes del mosaico debajo del carrusel."
        items={promoItems}
        onRemove={removeBanner}
      />
    </div>
  );
}

function BannerList({
  title,
  subtitle,
  items,
  onRemove,
}: {
  title: string;
  subtitle: string;
  items: BannerItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl border bg-white p-5">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin imágenes cargadas.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border">
              <div className="relative h-28 w-full bg-slate-100">
                <Image
                  src={resolveProductImageUrl(item.imageUrl)}
                  alt={item.title ?? "Banner"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1 p-3 text-xs text-slate-600">
                <p className="font-medium text-slate-800">{item.title || "(sin título)"}</p>
                {item.linkUrl ? <p className="truncate">Link: {item.linkUrl}</p> : null}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="pt-1 font-semibold text-rose-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
