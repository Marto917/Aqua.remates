"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 15_000;
const SEEN_KEY = "aqua-staff-seen-pack-ids";

type PendingOrder = {
  id: string;
  buyerName: string;
  createdAt: string;
  shippingMethod: string;
  totalAmount: number;
};

type ToastItem = {
  id: string;
  buyerName: string;
};

function readSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function StaffOrderAlerts({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const primed = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/staff/orders/pending-pack", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          count?: number;
          orders?: PendingOrder[];
        };
        const orders = data.orders ?? [];
        const count = typeof data.count === "number" ? data.count : orders.length;
        onCountChange?.(count);

        const ids = new Set(orders.map((o) => o.id));
        const seen = readSeenIds();

        if (!primed.current) {
          primed.current = true;
          writeSeenIds(ids);
          return;
        }

        const newcomers = orders.filter((o) => !seen.has(o.id));
        if (newcomers.length === 0) {
          // prune seen to current pending set + keep recent
          const next = new Set<string>();
          for (const id of seen) {
            if (ids.has(id)) next.add(id);
          }
          for (const id of ids) next.add(id);
          writeSeenIds(next);
          return;
        }

        for (const o of newcomers) seen.add(o.id);
        writeSeenIds(seen);

        setToasts((prev) => {
          const merged = [
            ...newcomers.map((o) => ({ id: o.id, buyerName: o.buyerName })),
            ...prev,
          ];
          const dedup = new Map(merged.map((t) => [t.id, t]));
          return [...dedup.values()].slice(0, 5);
        });

        // Si ya están en envíos, refrescar la lista
        if (pathname.startsWith("/vendedor/envios")) {
          router.refresh();
        }
      } catch {
        /* ignore transient errors */
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname, router, onCountChange]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg shadow-amber-900/10"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-950">Nuevo pedido para armar</p>
              <p className="mt-0.5 text-xs text-amber-900">{t.buyerName}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded px-1.5 text-sm text-amber-800 hover:bg-amber-100"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              href={`/vendedor/envios/minorista/${t.id}/armar`}
              onClick={() => dismiss(t.id)}
              className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Armar ahora
            </Link>
            <Link
              href="/vendedor/envios"
              onClick={() => dismiss(t.id)}
              className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Ver envíos
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
