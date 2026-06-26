"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/cart-context";

/** Vacía el carrito solo cuando el pago quedó confirmado en el servidor. */
export function ClearCartOnPaymentSuccess({ active }: { active: boolean }) {
  const { clearLines } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (!active || cleared.current) return;
    clearLines();
    cleared.current = true;
  }, [active, clearLines]);

  return null;
}
