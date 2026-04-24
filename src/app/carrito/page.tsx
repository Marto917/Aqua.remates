"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { getEffectivePriceModeForProduct } from "@/lib/wholesale-pricing";
import { getFinalUnitPrice, type PriceMode } from "@/lib/catalog-pricing";
import { formatDisplayWords } from "@/lib/display-text";
import { ERROR_PRODUCT_IMAGE, resolveProductImageUrl } from "@/lib/product-images";

export default function CarritoPage() {
  const { lines, mode, setQuantity, removeLine, subtotalDisplay, totalsByProduct } = useCart();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Carrito</h1>
      <p className="text-sm text-slate-600">
        Modo actual: <strong>{mode === "wholesale" ? "Mayorista" : "Minorista"}</strong>. En mayorista, el precio
        mayorista aplica cuando sumás 2 o más unidades del mismo producto (entre colores).
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
            const eff: PriceMode = getEffectivePriceModeForProduct(mode, line.productId, totalsByProduct);
            const unit = getFinalUnitPrice(
              {
                retailPrice: line.retailPrice,
                wholesalePrice: line.wholesalePrice,
                discountRetailPercent: line.discountRetailPercent,
                discountWholesalePercent: line.discountWholesalePercent,
              },
              eff,
            );
            const lineTotal = unit * line.quantity;
            return (
              <li
                key={line.variantId}
                className="flex gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveProductImageUrl(line.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = ERROR_PRODUCT_IMAGE;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {formatDisplayWords(line.productName)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Color: {formatDisplayWords(line.colorLabel)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {eff === "wholesale" ? "Precio mayorista" : "Precio minorista"} c/u
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      Cant.
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.variantId, Number(e.target.value) || 1)}
                        className="w-16 rounded border px-2 py-1"
                      />
                    </label>
                    <button
                      type="button"
                      className="text-sm text-rose-600 underline"
                      onClick={() => removeLine(line.variantId)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-dark">
                    {lineTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 && (
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">Total estimado</p>
            <p className="text-2xl font-bold text-brand-dark">{subtotalDisplay}</p>
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-brand px-8 py-3 text-center text-base font-semibold text-white hover:bg-brand-dark"
          >
            Continuar al pago
          </Link>
        </div>
      )}
    </div>
  );
}
