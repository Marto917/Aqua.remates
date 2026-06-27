"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { authFieldClass, authPrimaryButtonClass } from "@/components/auth/auth-styles";

type Props = {
  turnstileSiteKey?: string | null;
};

export function StaffLoginForm({ turnstileSiteKey = null }: Props) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/admin";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const needsTurnstile = Boolean(turnstileSiteKey);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (needsTurnstile && !turnstileToken) {
          setError("Completá la verificación anti-bots.");
          return;
        }
        setLoading(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          loginMode: "staff",
          turnstileToken: turnstileToken ?? "",
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          setError("Acceso denegado. Verificá email y contraseña de staff.");
          setLoading(false);
          return;
        }

        window.location.href = result?.url ?? callbackUrl;
      }}
    >
      <div className="space-y-1">
        <label htmlFor="staff-email" className="text-sm font-medium text-slate-700">
          Email corporativo
        </label>
        <input
          id="staff-email"
          required
          type="email"
          name="email"
          autoComplete="username"
          className={authFieldClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="staff-password" className="text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          id="staff-password"
          required
          type="password"
          name="password"
          autoComplete="current-password"
          className={authFieldClass}
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      {turnstileSiteKey ? (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      ) : null}
      <button
        disabled={loading || (needsTurnstile && !turnstileToken)}
        type="submit"
        className={authPrimaryButtonClass}
      >
        {loading ? "Ingresando…" : "Ingresar al panel"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Acceso restringido al equipo. Esta URL no está enlazada desde la tienda pública.
      </p>
    </form>
  );
}
