"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function RegistroForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/catalog";
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-brand-dark">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-600">
        Registrate con Google o con email. Con Google tu cuenta queda verificada al instante.
      </p>

      {googleEnabled ? (
        <div className="mt-4 space-y-4">
          <GoogleSignInButton callbackUrl={callbackUrl} label="Registrarse con Google" />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            o con email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Google no está configurado en el servidor. Usá el formulario de email.
        </p>
      )}

      <form
        className="mt-4 space-y-3"
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
          className="w-full rounded-lg border border-slate-200 px-3 py-3 text-base"
        />
        <input
          name="email"
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-slate-200 px-3 py-3 text-base"
        />
        <input
          name="password"
          required
          type="password"
          minLength={6}
          placeholder="Contraseña (mín. 6 caracteres)"
          className="w-full rounded-lg border border-slate-200 px-3 py-3 text-base"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand py-3 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarme con email"}
        </button>
      </form>
      {mensaje ? <p className="mt-3 text-sm text-slate-700">{mensaje}</p> : null}
      {devLink ? (
        <p className="mt-2 break-all text-xs text-slate-500">
          Link dev:{" "}
          <a className="text-brand underline" href={devLink}>
            {devLink}
          </a>
        </p>
      ) : null}
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-brand underline"
        >
          Ingresar
        </Link>
      </p>
    </section>
  );
}
