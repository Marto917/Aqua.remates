"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 15_000;

type Props = {
  /** Actualiza la lista automáticamente (envíos en camino o pedidos por armar). */
  enabled: boolean;
};

export function EnviosLiveRefresh({ enabled }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <p className="mt-1 text-xs text-slate-500">
      Esta lista se actualiza automáticamente cada {REFRESH_MS / 1000} s.
    </p>
  );
}
