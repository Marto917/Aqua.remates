"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PriceMode } from "@/lib/catalog";
import { useCart } from "@/contexts/cart-context";

export function PriceModeSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mode, setMode, lines, clearLines } = useCart();

  const updateMode = (next: PriceMode) => {
    if (next === mode) return;
    if (lines.length > 0) {
      const ok = window.confirm(
        "Al cambiar entre minorista y mayorista se vacía el carrito. ¿Querés continuar?",
      );
      if (!ok) return;
      clearLines();
    }
    setMode(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("priceMode", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-full border border-teal-100 bg-white p-1 text-sm shadow-sm">
      <button
        type="button"
        className={`rounded-full px-4 py-2 font-medium ${mode === "retail" ? "bg-brand text-white" : "text-slate-600"}`}
        onClick={() => updateMode("retail")}
      >
        Minorista
      </button>
      <button
        type="button"
        className={`rounded-full px-4 py-2 font-medium ${mode === "wholesale" ? "bg-brand text-white" : "text-slate-600"}`}
        onClick={() => updateMode("wholesale")}
      >
        Mayorista
      </button>
    </div>
  );
}
