"use client";

import { FormEvent, useRef, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  imageUrl: string | null;
  linkUrl: string | null;
};

export function AdminHomeRibbonForm({ imageUrl: initialUrl, linkUrl: initialLink }: Props) {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [linkUrl, setLinkUrl] = useState(initialLink ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [clear, setClear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = clear ? null : preview ?? (imageUrl ? resolveProductImageUrl(imageUrl) : null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    const fd = new FormData();
    if (file) fd.set("image", file);
    if (clear) fd.set("clear", "1");
    fd.set("linkUrl", linkUrl.trim());
    const res = await fetch("/api/admin/home-ribbon", { method: "POST", body: fd });
    const data = (await res.json()) as {
      error?: string;
      imageUrl?: string | null;
      linkUrl?: string | null;
    };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    setImageUrl(data.imageUrl ?? null);
    setLinkUrl(data.linkUrl ?? "");
    setFile(null);
    setClear(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setOk(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-brand/20 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Cinta promocional del inicio</h2>
        <p className="mt-1 text-sm text-slate-600">
          Imagen ancha debajo de la primera fila de productos. Recomendado{" "}
          <strong>1920 × 180 px</strong> (o similar, formato cinta).
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative block w-full overflow-hidden rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 transition hover:bg-brand/10"
        style={{ aspectRatio: "12 / 1", minHeight: "4.5rem" }}
        aria-label="Subir cinta promocional"
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Vista previa cinta" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-dark">
            TOCAR PARA SUBIR CINTA
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (preview) URL.revokeObjectURL(preview);
          setFile(f);
          setPreview(URL.createObjectURL(f));
          setClear(false);
        }}
      />

      {shown ? (
        <button
          type="button"
          className="text-xs font-medium text-rose-600 hover:underline"
          onClick={() => {
            setClear(true);
            setFile(null);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
          }}
        >
          Quitar imagen
        </button>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Link al tocar (opcional)</span>
        <input
          type="text"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="/catalog"
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Cinta guardada.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar cinta"}
      </button>
    </form>
  );
}
