"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { resolveProductImageUrl } from "@/lib/product-images";

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
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

  const carousel = banners.filter((b) => b.placement === "carousel");
  const promos = banners.filter((b) => b.placement === "promo");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Subir imagen promocional</h2>
        <p className="mt-1 text-sm text-slate-600">
          Elegí dónde se verá: <strong>Carrusel del home</strong> o{" "}
          <strong>Bloque de promos debajo del carrusel</strong>.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <select name="placement" required className="rounded-md border px-3 py-2">
            <option value="carousel">Carrusel principal del home</option>
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
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="rounded-md border px-3 py-2 sm:col-span-2"
          />
          <button
            disabled={saving}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
            type="submit"
          >
            {saving ? "Guardando..." : "Guardar imagen"}
          </button>
        </form>
      </div>

      <BannerList
        title="Carrusel principal"
        subtitle="Se muestra en el home como slider grande."
        items={carousel}
        onRemove={removeBanner}
      />
      <BannerList
        title="Promos secundarias"
        subtitle="Se muestra en el home como mosaico promocional."
        items={promos}
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
