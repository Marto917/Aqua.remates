"use client";

import { useCallback, useEffect, useState } from "react";
import { authPrimaryButtonClass } from "@/components/auth/auth-styles";

type Props = {
  initialEmail?: string;
  /** Si el enlace expiró, mostramos texto distinto. */
  expired?: boolean;
};

export function ResendVerificationForm({ initialEmail = "", expired = false }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMensaje(null);
      setError(null);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "No se pudo reenviar el mail.");
        if (typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds > 0) {
          setCooldown(data.retryAfterSeconds);
        }
        return;
      }
      setMensaje(data.message ?? "Te enviamos un nuevo enlace.");
      setCooldown(180);
    },
    [email],
  );

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
      <h2 className="text-sm font-semibold text-slate-800">
        {expired ? "¿Necesitás un enlace nuevo?" : "¿No te llegó el mail?"}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Podés pedir un reenvío cada 3 minutos (máximo 5 por día).
      </p>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          readOnly={Boolean(initialEmail)}
        />
        <button
          type="submit"
          disabled={loading || cooldown > 0 || !email.trim()}
          className={`${authPrimaryButtonClass} w-full text-sm`}
        >
          {loading
            ? "Enviando…"
            : cooldown > 0
              ? `Reenviar en ${cooldown}s`
              : "Reenviar mail de verificación"}
        </button>
      </form>
      {mensaje ? <p className="mt-3 text-sm text-emerald-800">{mensaje}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
