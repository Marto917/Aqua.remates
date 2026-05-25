"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import {
  authDividerClass,
  authFieldClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-styles";

type Props = {
  googleReady: boolean;
};

export function RegistroForm({ googleReady }: Props) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const googleHint = !googleReady
    ? "Configurá NEXT_PUBLIC_GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Railway para activar el login con Google."
    : undefined;

  return (
    <>
      <GoogleSignInButton
        callbackUrl={callbackUrl}
        label="Registrarse con Google"
        disabled={!googleReady}
        disabledHint={googleHint}
      />

      <div className={`${authDividerClass} my-5`}>
        <span className="h-px flex-1 bg-slate-200" />
        o con email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMensaje(null);
          setDevLink(null);
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              email: fd.get("email"),
              password: fd.get("password"),
            }),
          });
          const data = await res.json().catch(() => ({}));
          setLoading(false);
          if (!res.ok) {
            setMensaje(data.error ?? "No se pudo registrar.");
            return;
          }
          setMensaje(data.message ?? "Listo.");
          if (data.devLink) setDevLink(data.devLink);
        }}
      >
        <input
          name="name"
          required
          placeholder="Nombre y apellido"
          className={authFieldClass}
        />
        <input
          name="email"
          required
          type="email"
          placeholder="Email"
          className={authFieldClass}
        />
        <input
          name="password"
          required
          type="password"
          minLength={6}
          placeholder="Contraseña (mín. 6 caracteres)"
          className={authFieldClass}
        />
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? "Registrando…" : "Crear cuenta con email"}
        </button>
      </form>

      {mensaje ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{mensaje}</p>
      ) : null}
      {devLink ? (
        <p className="mt-2 break-all text-xs text-slate-500">
          Link dev:{" "}
          <a className="text-brand underline" href={devLink}>
            {devLink}
          </a>
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-brand-dark hover:underline"
        >
          Ingresar
        </Link>
      </p>
    </>
  );
}
