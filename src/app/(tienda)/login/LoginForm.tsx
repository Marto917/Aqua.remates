"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { authDividerClass, authFieldClass, authPrimaryButtonClass } from "@/components/auth/auth-styles";
import { customerAuthErrorMessage } from "@/lib/auth-errors";

type Props = {
  googleReady: boolean;
  turnstileSiteKey: string | null;
};

export function LoginForm({ googleReady, turnstileSiteKey }: Props) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    oauthError ? customerAuthErrorMessage(oauthError) : null,
  );
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const needsTurnstile = Boolean(turnstileSiteKey);

  return (
    <div className="space-y-5">
      <GoogleSignInButton
        callbackUrl={callbackUrl}
        label="Continuar con Google"
        disabled={!googleReady}
        disabledHint={
          googleReady ? undefined : "El ingreso con Google no está disponible por ahora."
        }
      />

      {error ? (
        <p className="text-center text-sm text-slate-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className={authDividerClass}>
        <span className="h-px flex-1 bg-slate-200" />
        o con email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (needsTurnstile && !turnstileToken) {
            setError("Completá la verificación para continuar.");
            return;
          }
          setLoading(true);
          setError(null);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim();
          const password = String(form.get("password") ?? "");
          const result = await signIn("credentials", {
            email,
            password,
            loginMode: "customer",
            turnstileToken: turnstileToken ?? "",
            callbackUrl,
            redirect: false,
          });

          if (result?.error) {
            setError("Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.");
            setLoading(false);
            return;
          }

          window.location.href = result?.url ?? callbackUrl;
        }}
      >
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="login-email"
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className={authFieldClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="login-password"
            required
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={authFieldClass}
          />
        </div>
        {turnstileSiteKey ? (
          <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
        ) : null}
        <button
          disabled={loading || (needsTurnstile && !turnstileToken)}
          type="submit"
          className={authPrimaryButtonClass}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
