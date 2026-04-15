"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";

export function MobileCartBar() {
  const { totalItems, subtotalDisplay } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-teal-100 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Total estimado</p>
          <p className="truncate text-lg font-bold text-brand-dark">{subtotalDisplay}</p>
        </div>
        <Link
          href="/carrito"
          className="shrink-0 rounded-full bg-brand px-5 py-3 text-center text-base font-semibold text-white"
        >
          Ver carrito {totalItems > 0 ? `(${totalItems})` : ""}
        </Link>
      </div>
    </div>
  );
}
