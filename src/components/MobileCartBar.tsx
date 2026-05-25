"use client";

import Link from "next/link";
import { IconCart } from "@/components/icons/NavIcons";
import { useCart } from "@/contexts/cart-context";

export function MobileCartBar() {
  const { totalItems, subtotalDisplay } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-teal-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Total estimado</p>
          <p className="truncate text-lg font-bold text-brand-dark">{subtotalDisplay}</p>
        </div>
        <Link
          href="/carrito"
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-3 text-base font-semibold text-white"
        >
          <IconCart className="h-5 w-5" />
          <span>{totalItems > 0 ? totalItems : ""}</span>
        </Link>
      </div>
    </div>
  );
}
