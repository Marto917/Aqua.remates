"use client";

import { useState } from "react";

type Props = {
  initialEnabled: boolean;
};

export function AdminRidersAppToggle({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onToggle(next: boolean) {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/riders-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setEnabled(next);
      setOk(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <h2 className="text-lg font-semibold text-slate-900">App de repartidores (riders)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Desactivado: los envíos se gestionan con repartidores propios (sin asignar rider, sin código ni
        QR de app). Activado: vuelve el flujo con app, código de entrega y asignación de repartidor.
      </p>
      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-800">
          {enabled ? "App de riders activada" : "App de riders desactivada"}
        </span>
      </label>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="mt-2 text-sm text-emerald-700">Guardado.</p> : null}
    </div>
  );
}
