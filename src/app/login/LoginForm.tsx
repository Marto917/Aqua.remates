"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { authDividerClass, authFieldClass, authPrimaryButtonClass } from "@/components/auth/auth-styles";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "No se pudo ingresar con Google. Probá con email o usá otra cuenta de cliente.",
  Configuration: "Google no está bien configurado en el servidor.",
  OAuthSignin: "Error al iniciar sesión con Google. Intentá de nuevo.",
  OAuthCallback: "Error al volver desde Google. Revisá que NEXTAUTH_URL coincida con tu dominio.",
};

type Props = {
  googleReady: boolean;
};

export function LoginForm({ googleReady }: Props) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    oauthError ? (ERROR_MESSAGES[oauthError] ?? "No se pudo ingresar con Google.") : null,
  );
  const [loading, setLoading] = useState(false);

  const googleHint = !googleReady
    ? "Configurá NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Railway para activar Google."
    : undefined;

  return (
    <div className="space-y-5">
      <GoogleSignInButton
        callbackUrl={callbackUrl}
        label="Continuar con Google"
        disabled={!googleReady}
        disabledHint={googleHint}
      />

      <div className={authDividerClass}>
        <span className="h-px flex-1 bg-slate-200" />
        o con email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim();
          const password = String(form.get("password") ?? "");
          const result = await signIn("credentials", {
            email,
            password,
            loginMode: "customer",
            callbackUrl,
            redirect: false,
          });

          if (result?.error) {
            setError("Email o contraseña incorrectos. Si sos del equipo, usá el acceso interno que te compartieron.");
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
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {error}
          </p>
        ) : null}
        <button disabled={loading} type="submit" className={authPrimaryButtonClass}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
