"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ShippingMenuItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "success";
};

type Props = {
  items: ShippingMenuItem[];
};

const toneClass: Record<NonNullable<ShippingMenuItem["tone"]>, string> = {
  default: "text-slate-800 hover:bg-slate-50",
  primary: "text-brand-dark hover:bg-brand-muted/60",
  warning: "text-amber-900 hover:bg-amber-50",
  success: "text-emerald-800 hover:bg-emerald-50",
};

export function ShippingActionsMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const enabled = items.filter((i) => !i.disabled);

  if (enabled.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-brand/40 hover:bg-brand-muted/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Acciones
        <span aria-hidden className="text-[10px] text-slate-500">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => {
            const cls = `${toneClass[item.tone ?? "default"]} block w-full px-3 py-2 text-left text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40`;
            if (item.disabled) {
              return (
                <div key={item.label} className="px-3 py-2 text-xs text-slate-400">
                  {item.label}
                  {item.hint ? <span className="mt-0.5 block text-[10px]">{item.hint}</span> : null}
                </div>
              );
            }
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={cls}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            }
            return null;
          })}
        </div>
      ) : null}
    </div>
  );
}
