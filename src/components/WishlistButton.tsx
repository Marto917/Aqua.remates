"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  productId: string;
  className?: string;
};

export function WishlistButton({ productId, className = "" }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        const data = (await res.json()) as { productIds?: string[] };
        if (!cancelled) setActive((data.productIds ?? []).includes(productId));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json()) as { active?: boolean };
      if (res.ok) setActive(Boolean(data.active));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm ring-1 ring-slate-200/80 transition hover:scale-105 hover:ring-brand/40 disabled:opacity-60 ${className}`}
    >
      <span className={active ? "text-rose-500" : "text-slate-400"} aria-hidden>
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
