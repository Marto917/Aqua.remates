"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 12_000;
const SEEN_KEY = "aqua-staff-seen-attention-ids";
const BASE_TITLE = "Aqua · Panel";

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
  kind: "review" | "pack";
};

export type StaffAttentionCounts = {
  total: number;
  review: number;
  pack: number;
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

function playAttentionBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.4);
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    /* ignore */
  }
}

export function StaffOrderAlerts({
  onCountsChange,
}: {
  onCountsChange?: (counts: StaffAttentionCounts) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [counts, setCounts] = useState<StaffAttentionCounts>({
    total: 0,
    review: 0,
    pack: 0,
  });
  const primed = useRef(false);
  const titleBase = useRef<string | null>(null);

  useEffect(() => {
    if (titleBase.current == null) {
      titleBase.current = document.title || BASE_TITLE;
    }
    if (counts.total > 0) {
      document.title = `(${counts.total}) ${titleBase.current}`;
    } else {
      document.title = titleBase.current;
    }
    return () => {
      if (titleBase.current) document.title = titleBase.current;
    };
  }, [counts.total]);

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
          reviewCount?: number;
          packCount?: number;
          totalAttention?: number;
          toReview?: PendingOrder[];
          toPack?: PendingOrder[];
        };

        const toReview = data.toReview ?? [];
        const toPack = data.toPack ?? data.orders ?? [];
        const review = typeof data.reviewCount === "number" ? data.reviewCount : toReview.length;
        const pack = typeof data.packCount === "number" ? data.packCount : toPack.length;
        const total =
          typeof data.totalAttention === "number" ? data.totalAttention : review + pack;

        const nextCounts = { total, review, pack };
        setCounts(nextCounts);
        onCountsChange?.(nextCounts);

        const ids = new Set([...toReview, ...toPack].map((o) => o.id));
        const seen = readSeenIds();

        if (!primed.current) {
          primed.current = true;
          writeSeenIds(ids);
          return;
        }

        const newReview = toReview.filter((o) => !seen.has(o.id));
        const newPack = toPack.filter((o) => !seen.has(o.id));
        const newcomers: ToastItem[] = [
          ...newReview.map((o) => ({ id: o.id, buyerName: o.buyerName, kind: "review" as const })),
          ...newPack.map((o) => ({ id: o.id, buyerName: o.buyerName, kind: "pack" as const })),
        ];

        if (newcomers.length === 0) {
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
        playAttentionBeep();

        setToasts((prev) => {
          const merged = [...newcomers, ...prev];
          const dedup = new Map(merged.map((t) => [t.id, t]));
          return [...dedup.values()].slice(0, 6);
        });

        if (
          pathname.startsWith("/vendedor/envios") ||
          pathname.startsWith("/admin/pedidos") ||
          pathname.startsWith("/vendedor/pedidos")
        ) {
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
  }, [pathname, router, onCountsChange]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const showBanner = counts.total > 0;

  return (
    <>
      {showBanner ? (
        <div className="sticky top-0 z-[55] border-b border-amber-300 bg-amber-100 px-3 py-2 text-amber-950 shadow-sm lg:top-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Tenés {counts.total} pedido{counts.total === 1 ? "" : "s"} pendiente
              {counts.total === 1 ? "" : "s"}
              {counts.review > 0 ? (
                <span className="font-normal">
                  {" "}
                  · {counts.review} a revisar pago
                </span>
              ) : null}
              {counts.pack > 0 ? (
                <span className="font-normal">
                  {" "}
                  · {counts.pack} a armar
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {counts.review > 0 ? (
                <Link
                  href="/admin/pedidos"
                  className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Revisar pagos
                </Link>
              ) : null}
              {counts.pack > 0 ? (
                <Link
                  href="/vendedor/envios"
                  className="rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-xs font-bold text-amber-950 hover:bg-amber-50"
                >
                  Ir a armar
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {toasts.length > 0 ? (
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
          aria-live="assertive"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                t.kind === "review"
                  ? "pointer-events-auto rounded-xl border border-amber-400 bg-amber-50 p-3 shadow-lg"
                  : "pointer-events-auto rounded-xl border border-violet-300 bg-violet-50 p-3 shadow-lg"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      t.kind === "review" ? "text-amber-950" : "text-violet-950"
                    }`}
                  >
                    {t.kind === "review" ? "Comprobante para revisar" : "Pedido para armar"}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      t.kind === "review" ? "text-amber-900" : "text-violet-900"
                    }`}
                  >
                    {t.buyerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="rounded px-1.5 text-sm opacity-70 hover:bg-black/5"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <Link
                  href={
                    t.kind === "review"
                      ? `/admin/pedidos/${t.id}`
                      : `/vendedor/envios/minorista/${t.id}/armar`
                  }
                  onClick={() => dismiss(t.id)}
                  className={
                    t.kind === "review"
                      ? "rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                      : "rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700"
                  }
                >
                  {t.kind === "review" ? "Revisar" : "Armar ahora"}
                </Link>
                <Link
                  href={t.kind === "review" ? "/admin/pedidos" : "/vendedor/envios"}
                  onClick={() => dismiss(t.id)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  Ver lista
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
