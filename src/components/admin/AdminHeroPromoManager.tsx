"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { HERO_PROMO_SPECS, type HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  initial: HeroPromoSettings;
};

function PlacementMock({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "desktop") {
    return (
      <div className="rounded-xl border-2 border-dashed border-brand/30 bg-brand-muted/30 p-3">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase text-brand-dark">Vista PC — inicio</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-2 shadow-sm">
          <div className="col-span-2 space-y-1">
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-8 rounded bg-brand/20" />
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-brand bg-brand/10 text-[9px] font-bold text-brand-dark">
            TU IMAGEN
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-600">{HERO_PROMO_SPECS.desktop.recommended}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase text-sky-800">Vista celular — inicio</p>
      <div className="mx-auto max-w-[140px] space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="h-4 rounded bg-slate-100" />
        <div className="flex h-10 items-center justify-center rounded-lg border-2 border-sky-400 bg-sky-100 text-[8px] font-bold text-sky-900">
          BANNER
        </div>
        <div className="h-3 rounded bg-slate-100" />
      </div>
      <p className="mt-2 text-[10px] text-slate-600">{HERO_PROMO_SPECS.mobile.recommended}</p>
    </div>
  );
}

function ImageUploadField({
  label,
  currentUrl,
  name,
  clearChecked,
  onClearChange,
  previewUrl,
  onPreview,
}: {
  label: string;
  currentUrl: string | null;
  name: string;
  clearChecked: boolean;
  onClearChange: (v: boolean) => void;
  previewUrl: string | null;
  onPreview: (url: string | null) => void;
}) {
  const shown = previewUrl || (currentUrl ? resolveProductImageUrl(currentUrl) : null);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {shown ? (
        <div
          className={`relative overflow-hidden rounded-xl border bg-slate-100 ${
            name === "desktopImage" ? "mx-auto aspect-[4/5] max-w-[180px]" : "aspect-[16/9] w-full"
          }`}
        >
          <Image src={shown} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <p className="text-xs text-slate-500">Sin imagen (se usa el diseño por defecto).</p>
      )}
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="w-full text-xs"
        onChange={(e) => {
          const file = e.target.files?.[0];
          onPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={clearChecked} onChange={(e) => onClearChange(e.target.checked)} />
        Quitar imagen actual
      </label>
    </div>
  );
}

export function AdminHeroPromoManager({ initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [clearDesktop, setClearDesktop] = useState(false);
  const [clearMobile, setClearMobile] = useState(false);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (clearDesktop) fd.set("clearDesktop", "on");
    if (clearMobile) fd.set("clearMobile", "on");

    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/hero-promo", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        settings?: HeroPromoSettings;
      };
      if (!res.ok || !data.ok || !data.settings) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setSettings(data.settings);
      setClearDesktop(false);
      setClearMobile(false);
      setDesktopPreview(null);
      setMobilePreview(null);
      form.reset();
      setOk(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Imagen grande del inicio</h2>
        <p className="mt-1 text-sm text-slate-600">
          2 fotos: una para computadora (derecha del buscador) y otra para celular (debajo del buscador).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlacementMock variant="desktop" />
        <PlacementMock variant="mobile" />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Guardado. Refrescá la tienda para verlo.</p> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Link al tocar la imagen (opcional)</span>
          <input
            name="linkUrl"
            type="text"
            defaultValue={settings.linkUrl ?? ""}
            placeholder="/catalog"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploadField
            label="Imagen PC"
            currentUrl={settings.desktopImageUrl}
            name="desktopImage"
            clearChecked={clearDesktop}
            onClearChange={setClearDesktop}
            previewUrl={desktopPreview}
            onPreview={setDesktopPreview}
          />
          <ImageUploadField
            label="Imagen celular"
            currentUrl={settings.mobileImageUrl}
            name="mobileImage"
            clearChecked={clearMobile}
            onClearChange={setClearMobile}
            previewUrl={mobilePreview}
            onPreview={setMobilePreview}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar imágenes del inicio"}
        </button>
      </form>
    </div>
  );
}
