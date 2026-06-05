"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  currentUrl: string | null;
};

export function AdminFooterImageForm({ currentUrl }: Props) {
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/footer-image", { method: "POST", body: fd });
    const data = (await res.json()) as { error?: string; footerImageUrl?: string | null };
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setUrl(data.footerImageUrl ?? null);
    setMessage("Imagen de pie de página actualizada.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <h2 className="font-semibold text-slate-900">Imagen de pie de página</h2>
      <p className="text-sm text-slate-600">
        Recomendado <strong>1920 × 400 px</strong> (proporción 4.8:1). Para mobile podés usar la misma
        imagen con el texto centrado; si querés más detalle en celular, subí también una versión{" "}
        <strong>1080 × 600 px</strong> (por ahora se usa una sola imagen responsive).
      </p>
      {url ? (
        <div className="relative aspect-[1920/400] max-h-40 w-full overflow-hidden rounded-lg border bg-slate-100">
          <Image src={resolveProductImageUrl(url)} alt="Pie de página" fill className="object-cover" unoptimized />
        </div>
      ) : null}
      <input type="file" name="footerImage" accept="image/jpeg,image/png,image/webp" className="text-sm" />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="clearFooter" />
        Quitar imagen del pie
      </label>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar pie de página"}
      </button>
    </form>
  );
}
