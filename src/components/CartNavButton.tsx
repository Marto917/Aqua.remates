"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CartPreviewDrawer } from "@/components/CartPreviewDrawer";
import { CartPreviewPopover } from "@/components/CartPreviewPopover";
import { IconCart } from "@/components/icons/NavIcons";
import { useCart } from "@/contexts/cart-context";
import { useCustomerCartGate } from "@/hooks/use-customer-cart-gate";

function isDesktopViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 640px)").matches;
}

export function CartNavButton() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { requireLogin } = useCustomerCartGate();
  const [open, setOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    if (!requireLogin()) return;
    if (isDesktopViewport()) {
      router.push("/carrito");
      return;
    }
    setOpen(true);
  }

  function openHoverPreview() {
    if (!isDesktopViewport()) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverPreview(true), 200);
  }

  function closeHoverPreview() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverPreview(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={openHoverPreview}
      onMouseLeave={closeHoverPreview}
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
        aria-label={`Carrito${totalItems > 0 ? `, ${totalItems} productos` : ""}`}
      >
        <IconCart />
        {totalItems > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        ) : null}
      </button>
      {hoverPreview ? <CartPreviewPopover onClose={closeHoverPreview} /> : null}
      <CartPreviewDrawer open={open} onClose={() => setOpen(false)} />
      <Link href="/carrito" className="sr-only">
        Ir al carrito
      </Link>
    </div>
  );
}
