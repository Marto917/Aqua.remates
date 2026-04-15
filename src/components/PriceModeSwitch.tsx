"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PriceMode } from "@/lib/catalog";

type PriceModeSwitchProps = {
  value: PriceMode;
};

export function PriceModeSwitch({ value }: PriceModeSwitchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateMode = (mode: PriceMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("priceMode", mode);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-lg border bg-white p-1 text-sm">
      <button
        type="button"
        className={`rounded-md px-4 py-2 ${value === "retail" ? "bg-brand text-white" : "text-slate-600"}`}
        onClick={() => updateMode("retail")}
      >
        Minorista
      </button>
      <button
        type="button"
        className={`rounded-md px-4 py-2 ${value === "wholesale" ? "bg-brand text-white" : "text-slate-600"}`}
        onClick={() => updateMode("wholesale")}
      >
        Mayorista
      </button>
    </div>
  );
}
