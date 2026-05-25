"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartPreviewDrawer } from "@/components/CartPreviewDrawer";
import { IconCart } from "@/components/icons/NavIcons";
import { useCart } from "@/contexts/cart-context";

function isDesktopViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 640px)").matches;
}

export function CartNavButton() {
  const router = useRouter();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (isDesktopViewport()) {
      router.push("/carrito");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
        aria-label={`Carrito${totalItems > 0 ? `, ${totalItems} productos` : ""}`}
      >
        <IconCart />
        {totalItems > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        ) : null}
      </button>
      <CartPreviewDrawer open={open} onClose={() => setOpen(false)} />
      <Link href="/carrito" className="sr-only">
        Ir al carrito
      </Link>
    </>
  );
}
