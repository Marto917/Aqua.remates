"use client";

import { SessionProvider } from "next-auth/react";
import { CartToast } from "@/components/CartToast";
import { CartProvider } from "@/contexts/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartToast />
      </CartProvider>
    </SessionProvider>
  );
}
