"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";

export function WholesaleModeToggle() {
  const router = useRouter();
  const { mode, setMode } = useCart();

  function toggle() {
    const next = mode === "retail" ? "wholesale" : "retail";
    setMode(next);
    router.push(next === "wholesale" ? "/catalog?priceMode=wholesale" : "/catalog?priceMode=retail");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 max-w-[11rem] rounded-full border-2 border-brand bg-brand-muted/40 px-3 py-2 text-center text-xs font-bold leading-tight text-brand-dark shadow-sm transition active:scale-[0.98] sm:max-w-none sm:px-4 sm:text-sm"
    >
      {mode === "retail" ? "Cambiar a mayorista" : "Cambiar a minorista"}
    </button>
  );
}
