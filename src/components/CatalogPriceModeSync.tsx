"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { PriceMode } from "@/lib/catalog-pricing";
import { useCart } from "@/contexts/cart-context";

/** Si la URL trae ?priceMode=, alinea el carrito; si no, respeta lo guardado en el dispositivo. */
export function CatalogPriceModeSync() {
  const { setMode } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get("priceMode");
    if (raw === "wholesale" || raw === "retail") {
      setMode(raw as PriceMode);
    }
  }, [searchParams, setMode]);

  return null;
}
