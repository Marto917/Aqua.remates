"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 20_000;

type Props = {
  /** Si hay envíos a domicilio en camino, la tabla se actualiza sola para mostrar entregas. */
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
    <p className="text-xs text-slate-500">
      Hay envíos en camino: esta lista se actualiza automáticamente cada {REFRESH_MS / 1000} s.
    </p>
  );
}
