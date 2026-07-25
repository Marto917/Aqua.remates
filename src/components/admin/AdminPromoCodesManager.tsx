"use client";

import { FormEvent, useMemo, useState } from "react";

type CategoryOpt = { id: string; name: string };
type ProductOpt = { id: string; name: string; categoryId: string };

export type PromoCodeItem = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  rewardType: "PERCENT" | "FIXED_AMOUNT";
  rewardValue: number;
  scopeType: "ALL" | "CATEGORIES" | "PRODUCTS";
  categoryIds: unknown;
  productIds: unknown;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
};

type Props = {
  initial: PromoCodeItem[];
  categories: CategoryOpt[];
  products: ProductOpt[];
};

function asIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string");
}

type Draft = {
  code: string;
  title: string;
  description: string;
  rewardType: "PERCENT" | "FIXED_AMOUNT";
  rewardValue: string;
  scopeType: "ALL" | "CATEGORIES" | "PRODUCTS";
  categoryIds: string[];
  productIds: string[];
  isActive: boolean;
  maxUses: string;
};

const emptyDraft = (): Draft => ({
  code: "",
  title: "",
  description: "",
  rewardType: "PERCENT",
  rewardValue: "5",
  scopeType: "ALL",
  categoryIds: [],
  productIds: [],
  isActive: true,
  maxUses: "",
});

export function AdminPromoCodesManager({ initial, categories, products }: Props) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [productFilter, setProductFilter] = useState("");

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
  }, [products, productFilter]);

  async function refresh() {
    const res = await fetch("/api/admin/promo-codes");
    const data = (await res.json()) as { items?: PromoCodeItem[] };
    if (data.items) setItems(data.items);
  }

  function payloadFromDraft(d: Draft) {
    return {
      code: d.code,
      title: d.title || null,
      description: d.description || null,
      rewardType: d.rewardType,
      rewardValue: Number(d.rewardValue),
      scopeType: d.scopeType,
      categoryIds: d.categoryIds,
      productIds: d.productIds,
      isActive: d.isActive,
      maxUses: d.maxUses.trim() ? Number(d.maxUses) : null,
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft(draft)),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear.");
        return;
      }
      setDraft(emptyDraft());
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: FormEvent, id: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromDraft(draft)),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditingId(null);
      setDraft(emptyDraft());
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este código?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: PromoCodeItem) {
    setEditingId(item.id);
    setDraft({
      code: item.code,
      title: item.title ?? "",
      description: item.description ?? "",
      rewardType: item.rewardType,
      rewardValue: String(item.rewardValue),
      scopeType: item.scopeType,
      categoryIds: asIdList(item.categoryIds),
      productIds: asIdList(item.productIds),
      isActive: item.isActive,
      maxUses: item.maxUses != null ? String(item.maxUses) : "",
    });
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <form
        onSubmit={editingId ? (e) => void onUpdate(e, editingId) : (e) => void onCreate(e)}
        className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-white p-5"
      >
        <h2 className="text-base font-semibold text-slate-900">
          {editingId ? "Editar código" : "Nuevo código"}
        </h2>
        <p className="text-sm text-slate-600">
          Ejemplo: código <strong>AQUA</strong>, 5% extra en electrodomésticos, o $2000 a favor en
          productos seleccionados.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Palabra del código *
            <input
              required
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              placeholder="AQUA"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Título (opcional)
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Promo electrodomésticos"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-slate-600">Beneficio *</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={draft.rewardType === "PERCENT"}
                onChange={() => setDraft({ ...draft, rewardType: "PERCENT" })}
              />
              Descuento %
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={draft.rewardType === "FIXED_AMOUNT"}
                onChange={() => setDraft({ ...draft, rewardType: "FIXED_AMOUNT" })}
              />
              Plata a favor ($)
            </label>
          </div>
          <input
            required
            type="number"
            min={draft.rewardType === "PERCENT" ? 1 : 1}
            max={draft.rewardType === "PERCENT" ? 99 : undefined}
            step={draft.rewardType === "PERCENT" ? 1 : 0.01}
            value={draft.rewardValue}
            onChange={(e) => setDraft({ ...draft, rewardValue: e.target.value })}
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-slate-600">Condición (a qué aplica) *</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["ALL", "Todo el carrito"],
                ["CATEGORIES", "Categorías"],
                ["PRODUCTS", "Productos"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={draft.scopeType === value}
                  onChange={() => setDraft({ ...draft, scopeType: value })}
                />
                {label}
              </label>
            ))}
          </div>

          {draft.scopeType === "CATEGORIES" ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.categoryIds.includes(c.id)}
                    onChange={(e) => {
                      setDraft({
                        ...draft,
                        categoryIds: e.target.checked
                          ? [...draft.categoryIds, c.id]
                          : draft.categoryIds.filter((id) => id !== c.id),
                      });
                    }}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          ) : null}

          {draft.scopeType === "PRODUCTS" ? (
            <div className="space-y-2">
              <input
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {filteredProducts.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.productIds.includes(p.id)}
                      onChange={(e) => {
                        setDraft({
                          ...draft,
                          productIds: e.target.checked
                            ? [...draft.productIds, p.id]
                            : draft.productIds.filter((id) => id !== p.id),
                        });
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
              {draft.productIds.length > 0 ? (
                <p className="text-xs text-slate-500">{draft.productIds.length} producto(s) elegido(s)</p>
              ) : null}
            </div>
          ) : null}
        </fieldset>

        <label className="block text-xs font-medium text-slate-600">
          Descripción / condiciones (opcional)
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Válido solo en transferencia, no acumulable…"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            Activo
          </label>
          <label className="text-xs font-medium text-slate-600">
            Máx. usos (opcional)
            <input
              type="number"
              min={1}
              value={draft.maxUses}
              onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })}
              className="ml-2 w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Crear código"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDraft(emptyDraft());
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Todavía no hay códigos.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-bold tracking-wide text-slate-900">
                    {item.code}
                    {!item.isActive ? (
                      <span className="ml-2 text-xs font-sans font-normal text-amber-700">
                        (inactivo)
                      </span>
                    ) : null}
                  </p>
                  {item.title ? <p className="text-sm text-slate-700">{item.title}</p> : null}
                  <p className="mt-1 text-sm text-slate-600">
                    {item.rewardType === "PERCENT"
                      ? `${item.rewardValue}% de descuento`
                      : `$${item.rewardValue.toLocaleString("es-AR")} a favor`}
                    {" · "}
                    {item.scopeType === "ALL"
                      ? "Todo el carrito"
                      : item.scopeType === "CATEGORIES"
                        ? `${asIdList(item.categoryIds).length} categoría(s)`
                        : `${asIdList(item.productIds).length} producto(s)`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Usos: {item.usedCount}
                    {item.maxUses != null ? ` / ${item.maxUses}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
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
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
