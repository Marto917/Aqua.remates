"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "aqua-cart-v3";

export type CartLine = {
  variantId: string;
  productId: string;
  quantity: number;
  productName: string;
  colorLabel: string;
  imageUrl: string;
  listPrice: number;
  transferPrice: number;
  discountPercent: number;
};

type CartState = {
  lines: CartLine[];
};

const defaultState: CartState = { lines: [] };

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearLines: () => void;
  totalItems: number;
  subtotalTransfer: string;
  subtotalTransferAmount: number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadState(): CartState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && Array.isArray(parsed.lines)) {
        return { lines: parsed.lines };
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

function lineSubtotal(line: CartLine): number {
  return line.transferPrice * line.quantity;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const stored = loadState();
    queueMicrotask(() => {
      setState((current) => (current.lines.length > 0 ? current : stored));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) persistState(state);
  }, [state, hydrated]);

  const addLine = useCallback((line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
    const qty = line.quantity ?? 1;
    setState((s) => {
      const idx = s.lines.findIndex((l) => l.variantId === line.variantId);
      if (idx >= 0) {
        const next = [...s.lines];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return { lines: next };
      }
      return {
        lines: [
          ...s.lines,
          {
            variantId: line.variantId,
            productId: line.productId,
            productName: line.productName,
            colorLabel: line.colorLabel,
            imageUrl: line.imageUrl,
            listPrice: line.listPrice,
            transferPrice: line.transferPrice,
            discountPercent: line.discountPercent,
            quantity: qty,
          },
        ],
      };
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setState((s) => {
      if (quantity <= 0) {
        return { lines: s.lines.filter((l) => l.variantId !== variantId) };
      }
      return {
        lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
      };
    });
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setState((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
  }, []);

  const clearLines = useCallback(() => {
    setState({ lines: [] });
  }, []);

  const subtotalTransferAmount = useMemo(
    () => state.lines.reduce((a, l) => a + lineSubtotal(l), 0),
    [state.lines],
  );

  const subtotalTransfer = useMemo(
    () =>
      subtotalTransferAmount.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    [subtotalTransferAmount],
  );

  const totalItems = useMemo(
    () => state.lines.reduce((a, l) => a + l.quantity, 0),
    [state.lines],
  );

  const value = useMemo(
    () => ({
      lines: state.lines,
      addLine,
      setQuantity,
      removeLine,
      clearLines,
      totalItems,
      subtotalTransfer,
      subtotalTransferAmount,
      hydrated,
    }),
    [
      state.lines,
      addLine,
      setQuantity,
      removeLine,
      clearLines,
      totalItems,
      subtotalTransfer,
      subtotalTransferAmount,
      hydrated,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart dentro de CartProvider");
  return ctx;
}
