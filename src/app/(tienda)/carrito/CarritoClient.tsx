"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";

export function CarritoClient() {
  const { lines, setQuantity, removeLine, subtotalTransfer } = useCart();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Carrito</h1>
      <p className="text-sm text-slate-600">
        Los totales son con <strong>precio transferencia</strong>. En el checkout podés pagar por transferencia o
        Mercado Pago (precio de lista).
      </p>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          Tu carrito está vacío.{" "}
          <Link href="/catalog" className="font-medium text-brand underline">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {lines.map((line) => {
            const unit = line.transferPrice;
            const lineTotal = unit * line.quantity;
            return (
              <li
                key={line.variantId}
                className="flex gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={resolveProductImageUrl(line.imageUrl)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{formatDisplayWords(line.productName)}</p>
                  <p className="text-sm text-slate-500">{formatDisplayWords(line.colorLabel)}</p>
                  <p className="mt-1 font-medium text-brand">
                    {unit.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded border text-sm"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded border text-sm"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-sm text-rose-600"
                      onClick={() => removeLine(line.variantId)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-semibold text-slate-900">
                  {lineTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 ? (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex justify-between text-lg font-bold">
            <span>Total (transferencia)</span>
            <span className="text-brand-dark">{subtotalTransfer}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-4 block w-full rounded-full bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark"
          >
            Ir a pagar
          </Link>
          <Link href="/catalog" className="mt-2 block text-center text-sm text-brand-dark underline">
            Seguir comprando
          </Link>
        </div>
      ) : null}
    </div>
  );
}
