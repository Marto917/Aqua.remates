"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { resolveProductImageUrl } from "@/lib/product-images";

export function CartToast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => clearToast(), 3200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] left-1/2 z-[70] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 animate-[cart-toast-in_0.25s_ease-out]"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <Image
            src={resolveProductImageUrl(toast.imageUrl)}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-800">Agregado al carrito</p>
          <p className="truncate text-xs text-slate-600">{toast.productName}</p>
        </div>
        <span className="text-lg text-emerald-600" aria-hidden>
          ✓
        </span>
      </div>
    </div>
  );
}
