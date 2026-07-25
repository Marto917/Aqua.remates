"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { formatArs } from "@/lib/currency";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";

export function CarritoClient() {
  const { lines, setQuantity, removeLine, subtotalTransfer } = useCart();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Tu carrito de compras</h1>
        <div className="mt-2 h-1 w-16 rounded-full bg-brand" aria-hidden />
        {lines.length > 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Tu carrito tiene {lines.length} producto{lines.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-slate-600">
        Los totales son con <strong>precio transferencia</strong>. En el checkout podés pagar por
        transferencia o Mercado Pago (precio de lista).
      </p>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          Tu carrito está vacío.{" "}
          <Link href="/catalog" className="font-medium text-brand underline">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          {lines.map((line) => {
            const unit = line.transferPrice;
            const list = line.listPrice;
            const lineTotal = unit * line.quantity;
            const showDiscount = list > unit + 0.01;
            const pct =
              line.discountPercent > 0
                ? line.discountPercent
                : showDiscount && list > 0
                  ? Math.round((1 - unit / list) * 100)
                  : 0;
            return (
              <li key={line.variantId} className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={resolveProductImageUrl(line.imageUrl)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {formatDisplayWords(line.productName)}
                    </p>
                    {pct > 0 ? (
                      <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        -{pct}%
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500">{formatDisplayWords(line.colorLabel)}</p>
                  <div className="flex flex-wrap items-end gap-6">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Cantidad
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          setQuantity(line.variantId, Math.max(1, Number(e.target.value) || 1))
                        }
                        className="mt-1 block w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm font-medium text-slate-900"
                      />
                    </label>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Precio unitario
                      </p>
                      {showDiscount ? (
                        <p className="text-xs text-slate-400 line-through">{formatArs(list)}</p>
                      ) : null}
                      <p className="font-semibold text-slate-900">{formatArs(unit)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </p>
                      <p className="font-bold text-slate-900">{formatArs(lineTotal)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    onClick={() => removeLine(line.variantId)}
                  >
                    × Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 ? (
        <div className="ml-auto max-w-md space-y-3 rounded-xl border bg-white p-5">
          <div className="flex justify-between text-sm">
            <span className="uppercase tracking-wide text-slate-500">Total productos</span>
            <span className="font-semibold text-slate-900">{subtotalTransfer}</span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-brand-dark">{subtotalTransfer}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Precio transferencia</p>
            <p className="mt-2 text-xs text-slate-500">
              Si tenés un código de descuento, lo podés aplicar en el checkout.
            </p>
          </div>
          <Link
            href="/checkout"
            className="mt-2 block w-full rounded-full bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark"
          >
            Ir a pagar
          </Link>
          <Link href="/catalog" className="block text-center text-sm text-brand-dark underline">
            Seguir comprando
          </Link>
        </div>
      ) : null}
    </div>
  );
}
