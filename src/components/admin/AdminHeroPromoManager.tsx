"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { HERO_PROMO_SPECS, type HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  initial: HeroPromoSettings;
};

type PlacementVariant = "desktop" | "mobile";

function ClickablePlacementPreview({
  variant,
  imageUrl,
  onPickFile,
  onClear,
}: {
  variant: PlacementVariant;
  imageUrl: string | null;
  onPickFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  if (variant === "desktop") {
    return (
      <div className="rounded-xl border-2 border-dashed border-brand/30 bg-brand-muted/30 p-3">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase text-brand-dark">
          Vista PC — inicio
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white p-2 shadow-sm">
          <div className="col-span-2 space-y-1 pointer-events-none" aria-hidden>
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-8 rounded bg-brand/20" />
          </div>
          <button
            type="button"
            onClick={openPicker}
            className="group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border-2 border-brand bg-brand/10 transition hover:border-brand-dark hover:bg-brand/20 focus:outline-none focus:ring-2 focus:ring-brand/50"
            aria-label={imageUrl ? "Cambiar imagen de PC" : "Subir imagen de PC"}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt="Vista previa PC" fill className="object-cover" unoptimized />
            ) : (
              <span className="px-1 text-center text-[9px] font-bold leading-tight text-brand-dark group-hover:underline">
                TOCAR PARA
                <br />
                SUBIR
              </span>
            )}
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-600">
          {HERO_PROMO_SPECS.desktop.recommended}
        </p>
        {imageUrl ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-1 w-full text-center text-[10px] font-medium text-rose-600 hover:underline"
          >
            Quitar imagen
          </button>
        ) : null}
        <input
          ref={inputRef}
          name="desktopImage"
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

  return (
    <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 p-3">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase text-sky-800">
        Vista celular — inicio
      </p>
      <div className="mx-auto max-w-[140px] space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="h-4 rounded bg-slate-100 pointer-events-none" aria-hidden />
        <button
          type="button"
          onClick={openPicker}
          className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-sky-400 bg-sky-100 transition hover:border-sky-600 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          aria-label={imageUrl ? "Cambiar imagen de celular" : "Subir imagen de celular"}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt="Vista previa celular" fill className="object-cover" unoptimized />
          ) : (
            <span className="px-1 text-center text-[8px] font-bold leading-tight text-sky-900 group-hover:underline">
              TOCAR PARA SUBIR
            </span>
          )}
          <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
        </button>
        <div className="h-3 rounded bg-slate-100 pointer-events-none" aria-hidden />
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-600">
        {HERO_PROMO_SPECS.mobile.recommended}
      </p>
      {imageUrl ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 w-full text-center text-[10px] font-medium text-rose-600 hover:underline"
        >
          Quitar imagen
        </button>
      ) : null}
      <input
        ref={inputRef}
        name="mobileImage"
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

export function AdminHeroPromoManager({ initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [clearDesktop, setClearDesktop] = useState(false);
  const [clearMobile, setClearMobile] = useState(false);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const desktopShown =
    desktopPreview ||
    (!clearDesktop && settings.desktopImageUrl
      ? resolveProductImageUrl(settings.desktopImageUrl)
      : null);

  const mobileShown =
    mobilePreview ||
    (!clearMobile && settings.mobileImageUrl
      ? resolveProductImageUrl(settings.mobileImageUrl)
      : null);

  function pickDesktop(file: File) {
    if (desktopPreview) URL.revokeObjectURL(desktopPreview);
    setDesktopFile(file);
    setDesktopPreview(URL.createObjectURL(file));
    setClearDesktop(false);
    setOk(false);
  }

  function pickMobile(file: File) {
    if (mobilePreview) URL.revokeObjectURL(mobilePreview);
    setMobileFile(file);
    setMobilePreview(URL.createObjectURL(file));
    setClearMobile(false);
    setOk(false);
  }

  function clearDesktopImage() {
    if (desktopPreview) URL.revokeObjectURL(desktopPreview);
    setDesktopPreview(null);
    setDesktopFile(null);
    setClearDesktop(true);
    setOk(false);
  }

  function clearMobileImage() {
    if (mobilePreview) URL.revokeObjectURL(mobilePreview);
    setMobilePreview(null);
    setMobileFile(null);
    setClearMobile(true);
    setOk(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    const linkInput = formRef.current?.querySelector<HTMLInputElement>('input[name="linkUrl"]');
    if (linkInput) fd.set("linkUrl", linkInput.value);
    if (desktopFile) fd.set("desktopImage", desktopFile);
    if (mobileFile) fd.set("mobileImage", mobileFile);
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
      if (desktopPreview) URL.revokeObjectURL(desktopPreview);
      if (mobilePreview) URL.revokeObjectURL(mobilePreview);
      setDesktopPreview(null);
      setMobilePreview(null);
      setDesktopFile(null);
      setMobileFile(null);
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
          Tocá el recuadro de la vista previa para subir la imagen. Una para PC (derecha del buscador) y otra
          para celular (debajo del buscador).
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ClickablePlacementPreview
            variant="desktop"
            imageUrl={desktopShown}
            onPickFile={pickDesktop}
            onClear={clearDesktopImage}
          />
          <ClickablePlacementPreview
            variant="mobile"
            imageUrl={mobileShown}
            onPickFile={pickMobile}
            onClear={clearMobileImage}
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {ok ? <p className="text-sm text-emerald-700">Guardado. Refrescá la tienda para verlo.</p> : null}

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
