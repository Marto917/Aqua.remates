"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { getTransferPrice } from "@/lib/store-pricing";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CartPreviewDrawer({ open, onClose }: Props) {
  const { lines, subtotalTransfer, setQuantity, removeLine, totalItems } = useCart();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar vista previa del carrito"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Carrito {totalItems > 0 ? `(${totalItems})` : ""}
          </h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600">
            Cerrar
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 py-2">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Tu carrito está vacío.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lines.map((line) => {
                const unit = getTransferPrice({
                  listPrice: line.listPrice,
                  retailPrice: line.transferPrice,
                  discountRetailPercent: line.discountPercent,
                });
                return (
                  <li key={line.variantId} className="flex gap-3 py-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={resolveProductImageUrl(line.imageUrl)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{line.productName}</p>
                      <p className="text-xs text-slate-500">{line.colorLabel}</p>
                      <p className="text-sm font-medium text-brand">
                        {unit.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-7 w-7 rounded border text-sm"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          className="h-7 w-7 rounded border text-sm"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="ml-auto text-xs text-rose-600"
                          onClick={() => removeLine(line.variantId)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Total (transferencia)</span>
            <span className="text-lg font-bold text-brand-dark">{subtotalTransfer}</span>
          </div>
          <Link
            href="/carrito"
            onClick={onClose}
            className="mt-3 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white"
          >
            Ver carrito completo
          </Link>
          {lines.length > 0 ? (
            <Link
              href="/checkout"
              onClick={onClose}
              className="mt-2 block w-full rounded-full border border-brand py-3 text-center text-sm font-semibold text-brand-dark"
            >
              Ir a pagar
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
