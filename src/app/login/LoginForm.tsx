"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "No se pudo ingresar con Google. Si sos empleado o dueño, usá email y contraseña. Si ya tenés cuenta con otro método, ingresá con email.",
  Configuration: "Google no está configurado en el servidor (revisá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).",
  OAuthSignin: "Error al iniciar sesión con Google. Intentá de nuevo.",
  OAuthCallback: "Error al volver desde Google. Revisá que NEXTAUTH_URL coincida con tu dominio.",
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/catalog";
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    oauthError ? (ERROR_MESSAGES[oauthError] ?? "No se pudo ingresar con Google.") : null,
  );
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      {googleEnabled ? (
        <>
          <GoogleSignInButton callbackUrl={callbackUrl} label="Continuar con Google" />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            o con email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "").trim();
          const password = String(form.get("password") ?? "");
          const branchKey = String(form.get("branchKey") ?? "").trim();
          const result = await signIn("credentials", {
            email,
            password,
            branchKey,
            callbackUrl,
            redirect: false,
          });

          if (result?.error) {
            const detail =
              process.env.NODE_ENV === "development" && result.error !== "CredentialsSignin"
                ? ` (${result.error})`
                : "";
            setError(
              result.error === "Configuration"
                ? "Error de configuración del servidor (revisá NEXTAUTH_SECRET y variables en el hosting)."
                : `Credenciales inválidas o no se pudo conectar a la base de datos.${detail}`,
            );
            setLoading(false);
            return;
          }

          window.location.href = result?.url ?? callbackUrl;
        }}
      >
        <input
          required
          type="email"
          name="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="password"
          name="branchKey"
          placeholder="Clave de sucursal (solo staff)"
          className="w-full rounded-md border px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-md bg-brand px-4 py-2 text-white disabled:opacity-70"
        >
          {loading ? "Ingresando..." : "Ingresar con email"}
        </button>
      </form>
    </div>
  );
}
