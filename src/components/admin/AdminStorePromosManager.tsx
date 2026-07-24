"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

export type StorePromoItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  logoUrl: string | null;
  sortOrder: number;
  published: boolean;
};

type Props = {
  initial: StorePromoItem[];
};

export function AdminStorePromosManager({ initial }: Props) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/store-promos");
    const data = (await res.json()) as { items?: StorePromoItem[] };
    if (data.items) setItems(data.items);
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/store-promos", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear.");
        return;
      }
      e.currentTarget.reset();
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch(`/api/admin/store-promos/${id}`, { method: "PATCH", body: fd });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditingId(null);
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta promoción?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/store-promos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("No se pudo eliminar.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Promos públicas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cards de la página <strong>/promociones</strong>. Al tocar “Ver promoción” se muestra la
          descripción y los términos.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <form onSubmit={onCreate} className="space-y-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-slate-800">Nueva promoción</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Título
            <input name="title" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Resumen (en la card)
            <input name="summary" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Descripción y términos
            <textarea
              name="body"
              required
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Detalle de la promo, vigencia, exclusiones…"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Logo / imagen
            <input name="logoFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Orden
            <input name="sortOrder" type="number" defaultValue={0} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input name="published" type="checkbox" defaultChecked className="rounded border-slate-300" />
            Publicada
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Agregar promo"}
        </button>
      </form>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">Todavía no hay promos públicas.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-100 p-4">
              {editingId === item.id ? (
                <form onSubmit={(e) => void onUpdate(e, item.id)} className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Título
                    <input name="title" defaultValue={item.title} required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Slug
                    <input name="slug" defaultValue={item.slug} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Resumen
                    <input name="summary" defaultValue={item.summary} required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Descripción y términos
                    <textarea name="body" defaultValue={item.body} required rows={5} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Nuevo logo (opcional)
                    <input name="logoFile" type="file" accept="image/*" className="mt-1 block w-full text-sm" />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Orden
                    <input name="sortOrder" type="number" defaultValue={item.sortOrder} className="mt-1 w-32 rounded-lg border px-3 py-2 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="hidden" name="published" value="off" />
                    <input name="published" type="checkbox" value="on" defaultChecked={item.published} />
                    Publicada
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy} className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-full border px-4 py-1.5 text-sm">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start gap-4">
                  {item.logoUrl ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <Image
                        src={resolveProductImageUrl(item.logoUrl)}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      Sin logo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.title}{" "}
                      {!item.published ? (
                        <span className="text-xs font-normal text-amber-700">(borrador)</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-slate-600">{item.summary}</p>
                    <p className="mt-1 text-xs text-slate-400">/{item.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(item.id)}
                      className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
