"use client";

import { useId, useState } from "react";

const ITEMS = [
  {
    colorClass: "bg-orange-200 ring-1 ring-orange-300",
    title: "Naranja pastel",
    body: "Pedido nuevo: todavía no lo abrió ningún vendedor. Lleva el cartelito NEW.",
  },
  {
    colorClass: "bg-amber-300 ring-1 ring-amber-400",
    title: "Ámbar",
    body: "Requiere atención: el cliente envió comprobante de transferencia y hay que revisar el pago. Lleva el cartelito REVISAR.",
  },
  {
    colorClass: "bg-sky-200 ring-1 ring-sky-300",
    title: "Celeste",
    body: "Ya se vio el pedido, pero todavía falta (pago pendiente, datos, etc.).",
  },
  {
    colorClass: "bg-violet-300 ring-1 ring-violet-400",
    title: "Violeta",
    body: "Pago OK / confirmado: hay que armar el pedido o está en camino (aún no finalizó la entrega o el retiro).",
  },
  {
    colorClass: "bg-emerald-400 ring-1 ring-emerald-500",
    title: "Verde",
    body: "Finalizado: entregado a domicilio, o confirmado y armado para retiro / envío a coordinar.",
  },
  {
    colorClass: "bg-rose-400 ring-1 ring-rose-500",
    title: "Rojo",
    body: "Pedido rechazado o cancelado.",
  },
] as const;

export function OrderStatusColorLegend() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <span
          aria-hidden
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white"
        >
          i
        </span>
        Información de colores
      </button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Significado de los colores de estado"
          className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,24rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:left-0 sm:right-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Colores en la bandeja
          </p>
          <ul className="mt-3 space-y-3">
            {ITEMS.map((item) => (
              <li key={item.title} className="flex gap-3 text-sm">
                <span
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full ${item.colorClass}`}
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-slate-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs font-medium text-brand-dark hover:underline"
          >
            Cerrar
          </button>
        </div>
      ) : null}
    </div>
  );
}
