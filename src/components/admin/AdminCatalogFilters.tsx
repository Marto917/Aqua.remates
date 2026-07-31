"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useTransition } from "react";
import type { CatalogVisibility } from "@prisma/client";
import { CATALOG_VISIBILITY_LABELS } from "@/lib/catalog-visibility";

export type AdminCatalogFilterValues = {
  q: string;
  category: string;
  active: string;
  visibility: string;
  supplier: string;
  incomplete: boolean;
};

type Props = {
  categories: { id: string; name: string }[];
  suppliers: string[];
  values: AdminCatalogFilterValues;
  resultCount: number;
  totalCount: number;
};

function buildHref(values: AdminCatalogFilterValues): string {
  const sp = new URLSearchParams();
  if (values.q.trim()) sp.set("q", values.q.trim());
  if (values.category) sp.set("category", values.category);
  if (values.active === "1" || values.active === "0") sp.set("active", values.active);
  if (values.visibility) sp.set("visibility", values.visibility);
  if (values.supplier) sp.set("supplier", values.supplier);
  if (values.incomplete) sp.set("incomplete", "1");
  const qs = sp.toString();
  return qs ? `/admin/productos?${qs}` : "/admin/productos";
}

function readForm(form: HTMLFormElement): AdminCatalogFilterValues {
  const fd = new FormData(form);
  return {
    q: String(fd.get("q") ?? ""),
    category: String(fd.get("category") ?? ""),
    active: String(fd.get("active") ?? ""),
    visibility: String(fd.get("visibility") ?? ""),
    supplier: String(fd.get("supplier") ?? ""),
    incomplete: fd.get("incomplete") === "1",
  };
}

export function AdminCatalogFilters({
  categories,
  suppliers,
  values,
  resultCount,
  totalCount,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const hasFilters =
    Boolean(values.q.trim()) ||
    Boolean(values.category) ||
    values.active === "1" ||
    values.active === "0" ||
    Boolean(values.visibility) ||
    Boolean(values.supplier) ||
    values.incomplete;

  function navigate(next: AdminCatalogFilterValues) {
    startTransition(() => {
      router.push(buildHref(next));
    });
  }

  function applyFromForm() {
    if (!formRef.current) return;
    navigate(readForm(formRef.current));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(readForm(e.currentTarget));
  }

  const field =
    "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={`space-y-3 rounded-xl border border-slate-200 bg-white p-4 ${pending ? "opacity-70" : ""}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Buscar y filtrar</p>
          <p className="text-xs text-slate-500">
            {hasFilters
              ? `Mostrando ${resultCount} de ${totalCount} artículos`
              : `${totalCount} artículos en el catálogo`}
          </p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={() =>
              navigate({
                q: "",
                category: "",
                active: "",
                visibility: "",
                supplier: "",
                incomplete: false,
              })
            }
            className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-600">Buscar</span>
          <input
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder="Nombre, código, SKU, categoría…"
            className={field}
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Categoría</span>
          <select name="category" defaultValue={values.category} className={field} onChange={applyFromForm}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Disponibilidad</span>
          <select name="active" defaultValue={values.active} className={field} onChange={applyFromForm}>
            <option value="">Todas</option>
            <option value="1">Activos</option>
            <option value="0">Ocultos</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Visibilidad</span>
          <select
            name="visibility"
            defaultValue={values.visibility}
            className={field}
            onChange={applyFromForm}
          >
            <option value="">Todas</option>
            {(Object.keys(CATALOG_VISIBILITY_LABELS) as CatalogVisibility[]).map((key) => (
              <option key={key} value={key}>
                {CATALOG_VISIBILITY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Proveedor</span>
          <select name="supplier" defaultValue={values.supplier} className={field} onChange={applyFromForm}>
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="incomplete"
          value="1"
          defaultChecked={values.incomplete}
          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          onChange={applyFromForm}
        />
        Solo incompletos (faltan código, imagen, precio, etc.)
      </label>
    </form>
  );
}
