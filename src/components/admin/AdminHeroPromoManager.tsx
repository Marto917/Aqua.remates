"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { HERO_PROMO_SPECS, type HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  initial: HeroPromoSettings;
};

type HeroPromoSpec = (typeof HERO_PROMO_SPECS)[keyof typeof HERO_PROMO_SPECS];

function SpecCard({ title, spec }: { title: string; spec: HeroPromoSpec }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">{title}</p>
      <dl className="mt-3 space-y-2 text-xs sm:text-sm">
        <div>
          <dt className="font-medium text-slate-500">Dónde se ve</dt>
          <dd className="mt-0.5">{spec.where}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Tamaño recomendado</dt>
          <dd className="mt-0.5">
            Mínimo {spec.minWidth}×{spec.minHeight} px (proporción {spec.aspect}). Ideal:{" "}
            <strong>{spec.recommended}</strong>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Dispositivo</dt>
          <dd className="mt-0.5">{spec.label}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Formato</dt>
          <dd className="mt-0.5">{spec.formats}</dd>
        </div>
      </dl>
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
      form.reset();
      setOk(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Imagen promocional del inicio</h2>
        <p className="mt-1 text-sm text-slate-600">
          Reemplaza el recuadro decorativo del hero en la página principal. Subí una versión para
          computadora y otra para celular.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpecCard title="Imagen desktop" spec={HERO_PROMO_SPECS.desktop} />
        <SpecCard title="Imagen mobile" spec={HERO_PROMO_SPECS.mobile} />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? (
        <p className="text-sm text-emerald-700">Imágenes guardadas. Actualizá la tienda para verlas.</p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Link al hacer clic (opcional)</span>
          <input
            name="linkUrl"
            type="text"
            defaultValue={settings.linkUrl ?? ""}
            placeholder="/catalog o https://..."
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Si lo dejás vacío, la imagen no será un enlace.
          </span>
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Desktop</p>
            {settings.desktopImageUrl ? (
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <Image
                  src={resolveProductImageUrl(settings.desktopImageUrl)}
                  alt="Vista previa desktop"
                  fill
                  className="object-cover"
                  unoptimized={settings.desktopImageUrl.startsWith("http")}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sin imagen — se muestra el diseño por defecto.</p>
            )}
            <input
              name="desktopImage"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={clearDesktop}
                onChange={(e) => setClearDesktop(e.target.checked)}
              />
              Quitar imagen desktop
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Mobile</p>
            {settings.mobileImageUrl ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <Image
                  src={resolveProductImageUrl(settings.mobileImageUrl)}
                  alt="Vista previa mobile"
                  fill
                  className="object-cover"
                  unoptimized={settings.mobileImageUrl.startsWith("http")}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sin imagen — no se muestra banner en celular.</p>
            )}
            <input
              name="mobileImage"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={clearMobile}
                onChange={(e) => setClearMobile(e.target.checked)}
              />
              Quitar imagen mobile
            </label>
          </div>
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
