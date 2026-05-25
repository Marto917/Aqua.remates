"use client";

import { FormEvent, useState } from "react";
import { formatDisplayWords } from "@/lib/display-text";

type Category = { id: string; name: string; slug: string };

export function AdminCategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [migrateFromId, setMigrateFromId] = useState<string | null>(null);
  const [migrateToId, setMigrateToId] = useState("");
  const [migrateConfirm, setMigrateConfirm] = useState(false);
  const [migrating, setMigrating] = useState(false);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim().toLowerCase() }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; category?: Category };
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear.");
      return;
    }
    if (data.category) {
      setCategories((list) => [...list, data.category!].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    }
  }

  async function removeCategory(id: string, label: string) {
    if (!window.confirm(`¿Borrar la categoría "${label}"?`)) return;
    setError(null);
    const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo borrar.");
      return;
    }
    setCategories((list) => list.filter((c) => c.id !== id));
    if (migrateFromId === id) {
      setMigrateFromId(null);
      setMigrateConfirm(false);
    }
  }

  async function runMigrate(fromId: string) {
    if (!migrateToId || !migrateConfirm) {
      setError("Elegí categoría destino y marcá la casilla de confirmación.");
      return;
    }
    setMigrating(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/categories/migrate-products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromCategoryId: fromId,
        toCategoryId: migrateToId,
        confirm: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      moved?: number;
      from?: string;
      to?: string;
    };
    setMigrating(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo migrar.");
      return;
    }
    setMessage(
      `Se movieron ${data.moved ?? 0} productos de "${data.from}" a "${data.to}".`,
    );
    setMigrateFromId(null);
    setMigrateToId("");
    setMigrateConfirm(false);
  }

  const fromCategory = categories.find((c) => c.id === migrateFromId);

  return (
    <div className="space-y-5">
      <form onSubmit={addCategory} className="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nueva categoría (ej. bazar)"
          className="min-w-[200px] flex-1 rounded-md border px-3 py-2"
          required
        />
        <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
          Agregar
        </button>
      </form>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <ul className="divide-y rounded-xl border bg-white">
        {categories.map((c) => (
          <li key={c.id} className="space-y-3 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{formatDisplayWords(c.name)}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMigrateFromId(migrateFromId === c.id ? null : c.id);
                    setMigrateToId("");
                    setMigrateConfirm(false);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  title="Mover todos los productos a otra categoría"
                >
                  Migrar productos
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(c.id, c.name)}
                  className="text-sm text-rose-600 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>

            {migrateFromId === c.id ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm">
                <p className="font-medium text-amber-950">
                  Mover todos los productos de{" "}
                  <strong>{formatDisplayWords(c.name)}</strong> a:
                </p>
                <select
                  value={migrateToId}
                  onChange={(e) => setMigrateToId(e.target.value)}
                  className="mt-2 w-full rounded-md border border-amber-300 bg-white px-3 py-2"
                >
                  <option value="">Elegir categoría destino</option>
                  {categories
                    .filter((other) => other.id !== c.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {formatDisplayWords(other.name)}
                      </option>
                    ))}
                </select>
                <label className="mt-3 flex items-start gap-2 text-amber-950">
                  <input
                    type="checkbox"
                    checked={migrateConfirm}
                    onChange={(e) => setMigrateConfirm(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Confirmo que quiero mover <strong>todos</strong> los productos de esta categoría
                    {fromCategory ? ` (${fromCategory.name})` : ""} a la categoría elegida.
                  </span>
                </label>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={migrating || !migrateConfirm || !migrateToId}
                    onClick={() => runMigrate(c.id)}
                    className="rounded-full bg-amber-700 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {migrating ? "Migrando…" : "Ejecutar migración"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMigrateFromId(null);
                      setMigrateConfirm(false);
                    }}
                    className="rounded-full border border-amber-400 px-4 py-1.5 text-xs text-amber-900"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
