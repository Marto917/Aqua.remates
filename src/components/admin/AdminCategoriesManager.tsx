"use client";

import { FormEvent, useState } from "react";
import { formatDisplayWords } from "@/lib/display-text";

type Category = { id: string; name: string; slug: string };

export function AdminCategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
  }

  async function migrateLegacy() {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/categories", { method: "PATCH" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      movedCocina?: number;
      movedHerramientas?: number;
    };
    if (!res.ok) {
      setError(data.error ?? "No se pudo migrar.");
      return;
    }
    setMessage(
      `Migración lista: ${data.movedCocina ?? 0} productos de cocina → bazar, ${data.movedHerramientas ?? 0} de herramientas → ferretería.`,
    );
    window.location.reload();
  }

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

      <button
        type="button"
        onClick={migrateLegacy}
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
      >
        Migrar cocina → bazar y herramientas → ferretería
      </button>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <ul className="divide-y rounded-xl border bg-white">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="font-medium text-slate-900">{formatDisplayWords(c.name)}</span>
            <button
              type="button"
              onClick={() => removeCategory(c.id, c.name)}
              className="text-sm text-rose-600 hover:underline"
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
