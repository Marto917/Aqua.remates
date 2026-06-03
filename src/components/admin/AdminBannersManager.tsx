"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { resolveProductImageUrl } from "@/lib/product-images";

const MAX_CAROUSEL = 3;

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

export function AdminBannersManager({ initialBanners }: Props) {
  const [banners, setBanners] = useState(initialBanners);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [placement, setPlacement] = useState<"carousel" | "promo">("carousel");
  const fileRef = useRef<HTMLInputElement>(null);

  const carousel = banners.filter((b) => b.placement === "carousel");
  const carouselFull = carousel.length >= MAX_CAROUSEL;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const placementValue = String(formData.get("placement") ?? "carousel");
    if (placementValue === "carousel" && carouselFull) {
      setError(`El carrusel admite como máximo ${MAX_CAROUSEL} imágenes.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banners", { method: "POST", body: formData });
      const data = (await res.json()) as { ok?: boolean; error?: string; banner?: BannerItem };
      if (!res.ok || !data.ok || !data.banner) {
        setError(data.error ?? "No se pudo guardar el banner.");
        setSaving(false);
        return;
      }
      setBanners((prev) => [data.banner!, ...prev]);
      form.reset();
      setFilePreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
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

  const carouselItems = banners.filter((b) => b.placement === "carousel");
  const promoItems = banners.filter((b) => b.placement === "promo");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Carrusel del home</h2>
        <p className="mt-1 text-sm text-slate-600">
          Máximo <strong>{MAX_CAROUSEL} imágenes</strong> en el slider principal. Subí JPG/PNG/WebP.
        </p>
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-600">
          El carrusel aparece arriba del catálogo en la página de inicio (banner ancho).
        </div>
        {carouselFull ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Ya tenés {MAX_CAROUSEL} imágenes en el carrusel. Eliminá una para agregar otra.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <input type="hidden" name="placement" value={placement} />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as "carousel" | "promo")}
            className="rounded-md border px-3 py-2 sm:col-span-2"
          >
            <option value="carousel">Carrusel principal (máx. {MAX_CAROUSEL})</option>
            <option value="promo">Bloque promos (debajo del carrusel)</option>
          </select>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            className="rounded-md border px-3 py-2"
            placeholder="Orden (0,1,2...)"
          />
          <input
            name="title"
            className="rounded-md border px-3 py-2 sm:col-span-2"
            placeholder="Título opcional"
          />
          <input
            name="linkUrl"
            className="rounded-md border px-3 py-2 sm:col-span-2"
            placeholder="Link opcional (ej: /catalog o https://...)"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked /> Activo
          </label>
          <input
            ref={fileRef}
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="rounded-md border px-3 py-2 sm:col-span-2"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFilePreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          {filePreview ? (
            <div className="relative h-32 w-full overflow-hidden rounded-xl border sm:col-span-2">
              <Image src={filePreview} alt="Vista previa" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <button
            disabled={saving || (placement === "carousel" && carouselFull)}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
            type="submit"
          >
            {saving ? "Guardando..." : "Subir imagen"}
          </button>
        </form>
      </div>

      <BannerList
        title="Carrusel principal"
        subtitle={`${carouselItems.length}/${MAX_CAROUSEL} imágenes activas en el slider.`}
        items={carouselItems}
        onRemove={removeBanner}
      />
      <BannerList
        title="Promos secundarias"
        subtitle="Mosaico debajo del carrusel en el inicio."
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
                <p>Orden: {item.sortOrder}</p>
                <p>Estado: {item.isActive ? "Activo" : "Inactivo"}</p>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="pt-1 font-semibold text-rose-600"
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
