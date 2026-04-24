"use client";

import { getFinalUnitPrice, type PriceMode } from "@/lib/catalog-pricing";
import {
  getEffectivePriceModeForProduct,
  quantityByProductId,
} from "@/lib/wholesale-pricing";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "aqua-cart-v2";

export type CartLine = {
  variantId: string;
  productId: string;
  quantity: number;
  productName: string;
  colorLabel: string;
  imageUrl: string;
  retailPrice: number;
  wholesalePrice: number;
  discountRetailPercent: number;
  discountWholesalePercent: number;
};

type CartState = {
  mode: PriceMode;
  lines: CartLine[];
};

const defaultState: CartState = { mode: "retail", lines: [] };

type CartContextValue = {
  mode: PriceMode;
  setMode: (mode: PriceMode) => void;
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearLines: () => void;
  totalItems: number;
  subtotalDisplay: string;
  totalsByProduct: Map<string, number>;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadState(): CartState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && Array.isArray(parsed.lines)) {
        return { mode: parsed.mode === "wholesale" ? "wholesale" : "retail", lines: parsed.lines };
      }
    }
  } catch {
    /* ignore */
  }
  return defaultState;
}

function persistState(state: CartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(defaultState);

  useEffect(() => {
    // Hidratar carrito desde localStorage solo en el cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga única post-mount
    setState(loadState());
  }, []);

  useEffect(() => {
    persistState(state);
  }, [state]);

  const setMode = useCallback((mode: PriceMode) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const clearLines = useCallback(() => {
    setState((s) => ({ ...s, lines: [] }));
  }, []);

  const addLine = useCallback((line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
    const qty = line.quantity ?? 1;
    setState((s) => {
      const idx = s.lines.findIndex((l) => l.variantId === line.variantId);
      if (idx >= 0) {
        const next = [...s.lines];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return { ...s, lines: next };
      }
      return {
        ...s,
        lines: [
          ...s.lines,
          {
            variantId: line.variantId,
            productId: line.productId,
            productName: line.productName,
            colorLabel: line.colorLabel,
            imageUrl: line.imageUrl,
            retailPrice: line.retailPrice,
            wholesalePrice: line.wholesalePrice,
            discountRetailPercent: line.discountRetailPercent,
            discountWholesalePercent: line.discountWholesalePercent,
            quantity: qty,
          },
        ],
      };
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setState((s) => {
      if (quantity <= 0) {
        return { ...s, lines: s.lines.filter((l) => l.variantId !== variantId) };
      }
      return {
        ...s,
        lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
      };
    });
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setState((s) => ({ ...s, lines: s.lines.filter((l) => l.variantId !== variantId) }));
  }, []);

  const totalsByProduct = useMemo(
    () => quantityByProductId(state.lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))),
    [state.lines],
  );

  const subtotalDisplay = useMemo(() => {
    let sum = 0;
    for (const line of state.lines) {
      const eff = getEffectivePriceModeForProduct(state.mode, line.productId, totalsByProduct);
      const unit = getFinalUnitPrice(
        {
          retailPrice: line.retailPrice,
          wholesalePrice: line.wholesalePrice,
          discountRetailPercent: line.discountRetailPercent,
          discountWholesalePercent: line.discountWholesalePercent,
        },
        eff,
      );
      sum += unit * line.quantity;
    }
    return sum.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }, [state.lines, state.mode, totalsByProduct]);

  const totalItems = useMemo(
    () => state.lines.reduce((a, l) => a + l.quantity, 0),
    [state.lines],
  );

  const value = useMemo(
    () => ({
      mode: state.mode,
      setMode,
      lines: state.lines,
      addLine,
      setQuantity,
      removeLine,
      clearLines,
      totalItems,
      subtotalDisplay,
      totalsByProduct,
    }),
    [
      state.mode,
      state.lines,
      setMode,
      addLine,
      setQuantity,
      removeLine,
      clearLines,
      totalItems,
      subtotalDisplay,
      totalsByProduct,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart dentro de CartProvider");
  return ctx;
}
