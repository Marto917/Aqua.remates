"use client";

import { useState } from "react";
import { AdminProductCreateForm } from "@/components/admin/AdminProductCreateForm";

type Props = {
  initialError?: string;
  supplierNames?: string[];
  categories: { id: string; name: string; slug: string }[];
  defaultOpen?: boolean;
};

export function AdminProductCreatePanel({
  initialError,
  supplierNames = [],
  categories,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id="crear-producto" className="rounded-xl border bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-lg font-semibold text-slate-900">Agregar producto</span>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
          {open ? "Ocultar" : "+ Nuevo artículo"}
        </span>
      </button>
      {open ? (
        <div className="border-t px-5 pb-5 pt-4">
          <AdminProductCreateForm
            initialError={initialError}
            supplierNames={supplierNames}
            categories={categories}
          />
        </div>
      ) : null}
    </div>
  );
}
