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

  const uploadButton = (aspectClass: string, label: string) => (
    <button
      type="button"
      onClick={openPicker}
      className={`group relative w-full overflow-hidden rounded-xl border-2 border-brand bg-brand/5 transition hover:border-brand-dark hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand/50 ${aspectClass}`}
      aria-label={imageUrl ? `Cambiar ${label}` : `Subir ${label}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={`Vista previa ${label}`} fill className="object-cover" unoptimized />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] font-bold leading-tight text-brand-dark group-hover:underline sm:text-xs">
          TOCAR PARA SUBIR
        </span>
      )}
      <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
    </button>
  );

  if (variant === "desktop") {
    return (
      <div className="rounded-xl border-2 border-dashed border-brand/30 bg-brand-muted/30 p-3 sm:p-4">
        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
          Vista PC — banner del inicio
        </p>
        <p className="mb-3 text-center text-[9px] text-slate-500">{HERO_PROMO_SPECS.desktop.where}</p>

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
          <div className="mb-2 flex items-center gap-2 pointer-events-none" aria-hidden>
            <div className="h-5 w-5 rounded-full bg-brand/20" />
            <div className="h-2 flex-1 max-w-[40%] rounded bg-slate-100" />
            <div className="ml-auto flex gap-1">
              <div className="h-4 w-4 rounded bg-slate-100" />
              <div className="h-4 w-4 rounded bg-slate-100" />
            </div>
          </div>

          {uploadButton("aspect-[3/1] min-h-[5rem] sm:min-h-[7rem]", "banner PC")}

          <div className="mt-2 h-7 rounded-lg bg-slate-50 pointer-events-none" aria-hidden />
        </div>

        <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-600">
          <strong>{HERO_PROMO_SPECS.desktop.recommended}</strong>
          <br />
          También: {HERO_PROMO_SPECS.desktop.altRecommended} · {HERO_PROMO_SPECS.desktop.formats}
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
    <div className="rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/80 p-3 sm:p-4">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-sky-900">
        Vista celular — banner del inicio
      </p>
      <p className="mb-3 text-center text-[9px] text-slate-500">{HERO_PROMO_SPECS.mobile.where}</p>

      <div className="mx-auto max-w-[200px] rounded-2xl border-2 border-slate-300 bg-white p-1.5 shadow-sm sm:max-w-[220px]">
        <div className="mb-1 flex items-center justify-between px-1 pointer-events-none" aria-hidden>
          <div className="h-2 w-8 rounded bg-slate-200" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        </div>
        <div className="space-y-1 rounded-xl bg-slate-50 p-1">
          <div className="flex items-center gap-1 px-0.5 pointer-events-none" aria-hidden>
            <div className="h-3 w-3 rounded-full bg-brand/20" />
            <div className="h-1.5 flex-1 rounded bg-slate-200" />
          </div>

          {uploadButton("aspect-[16/9] min-h-[4.5rem]", "banner celular")}

          <div className="h-4 rounded-md bg-white pointer-events-none" aria-hidden />
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-600">
        <strong>{HERO_PROMO_SPECS.mobile.recommended}</strong>
        <br />
        {HERO_PROMO_SPECS.mobile.formats}
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

  const hasPendingChanges =
    Boolean(desktopFile) || Boolean(mobileFile) || clearDesktop || clearMobile;

  return (
    <div className="space-y-4 rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Banner principal del inicio</h2>
        <p className="mt-1 text-sm text-slate-600">
          La imagen ocupa <strong>todo el ancho</strong> arriba de la tienda, sin texto encima. Tocá la vista
          previa para subir: una versión para PC (banner ancho 3:1) y otra para celular (16:9). Si subís solo
          una, se usa en ambos dispositivos.
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
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
          <span className="font-medium text-slate-700">Link al tocar el banner (opcional)</span>
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
          disabled={saving || !hasPendingChanges}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar banner del inicio"}
        </button>
      </form>
    </div>
  );
}
