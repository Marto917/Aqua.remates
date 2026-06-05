"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { useCustomerCartGate } from "@/hooks/use-customer-cart-gate";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  onClose: () => void;
};

export function CartPreviewPopover({ onClose }: Props) {
  const { lines, subtotalTransfer, totalItems } = useCart();
  const { requireLogin } = useCustomerCartGate();

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      onMouseLeave={onClose}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Carrito {totalItems > 0 ? `(${totalItems})` : ""}
        </h2>
      </div>
      <div className="max-h-64 overflow-y-auto px-4 py-2">
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Tu carrito está vacío.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lines.slice(0, 5).map((line) => (
              <li key={line.variantId} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={resolveProductImageUrl(line.imageUrl)}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{line.productName}</p>
                  <p className="text-xs text-slate-500">
                    {line.colorLabel} × {line.quantity}
                  </p>
                  <p className="text-sm font-medium text-brand">
                    {(line.transferPrice * line.quantity).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </p>
                </div>
              </li>
            ))}
            {lines.length > 5 ? (
              <li className="py-2 text-center text-xs text-slate-500">
                +{lines.length - 5} productos más
              </li>
            ) : null}
          </ul>
        )}
      </div>
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total (transferencia)</span>
          <span className="font-bold text-brand-dark">{subtotalTransfer}</span>
        </div>
        <Link
          href="/carrito"
          onClick={(e) => {
            if (!requireLogin()) {
              e.preventDefault();
              onClose();
              return;
            }
            onClose();
          }}
          className="mt-2 block w-full rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ver carrito
        </Link>
      </div>
    </div>
  );
}
