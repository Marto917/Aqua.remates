"use client";

import { useState } from "react";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";

type Props = {
  turnstileSiteKey: string | null;
};

export function LibroQuejasForm({ turnstileSiteKey }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const needsTurnstile = Boolean(turnstileSiteKey);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (needsTurnstile && !turnstileToken) {
      setError("Completá la verificación para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      if (turnstileToken) fd.set("turnstileToken", turnstileToken);
      const res = await fetch("/api/libro-de-quejas", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar. Intentá de nuevo.");
        return;
      }
      setOk(true);
      e.currentTarget.reset();
      setTurnstileToken(null);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <p className="font-semibold">Consulta enviada</p>
        <p className="mt-2 text-sm">
          Gracias. Te responderemos a la brevedad (tiempo aproximado: 24 horas hábiles).
        </p>
        <button
          type="button"
          onClick={() => setOk(false)}
          className="mt-4 text-sm font-medium underline"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/80 text-xs font-bold text-white">
          i
        </span>
        <p>Tiempo aproximado de respuesta: 24 horas hábiles.</p>
      </div>

      <label className="block text-sm font-semibold text-slate-800">
        Tu nombre <span className="text-rose-600">*</span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-normal text-slate-900"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        E-mail <span className="text-rose-600">*</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-normal text-slate-900"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Teléfono de contacto <span className="text-rose-600">*</span>
        <input
          name="phone"
          type="tel"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-normal text-slate-900"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Consulta <span className="text-rose-600">*</span>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Ingresá aquí tu consulta"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-normal text-slate-900"
        />
      </label>

      {turnstileSiteKey ? (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || (needsTurnstile && !turnstileToken)}
        className="w-full rounded-lg bg-brand py-3 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {loading ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
