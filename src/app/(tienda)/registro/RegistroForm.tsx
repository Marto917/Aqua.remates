"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import {
  authDividerClass,
  authFieldClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-styles";
import { getOrCreateDeviceId } from "@/lib/get-device-id";
import { HONEYPOT_FIELD_NAME } from "@/lib/honeypot";

type Props = {
  googleReady: boolean;
  turnstileSiteKey: string | null;
};

export function RegistroForm({ googleReady, turnstileSiteKey }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const googleHint = !googleReady
    ? "El registro con Google no está disponible por ahora."
    : undefined;

  const needsTurnstile = Boolean(turnstileSiteKey);

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
          if (password !== passwordConfirm) {
            setPasswordMismatch(true);
            return;
          }
          setPasswordMismatch(false);
          if (needsTurnstile && !turnstileToken) {
            setMensaje("Completá la verificación anti-bots.");
            return;
          }
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
              password,
              passwordConfirm,
              deviceId: getOrCreateDeviceId(),
              turnstileToken: turnstileToken ?? undefined,
              [HONEYPOT_FIELD_NAME]: fd.get(HONEYPOT_FIELD_NAME),
            }),
          });
          const data = await res.json().catch(() => ({}));
          setLoading(false);
          if (!res.ok) {
            setMensaje(data.error ?? "No se pudo registrar.");
            return;
          }
          const registeredEmail = String(fd.get("email") ?? "").trim();
          if (registeredEmail && !data.devLink) {
            router.push(
              `/cuenta/verificar-email?email=${encodeURIComponent(registeredEmail)}`,
            );
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
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordMismatch) setPasswordMismatch(false);
          }}
          placeholder="Contraseña (mín. 6 caracteres)"
          className={authFieldClass}
        />
        <input
          name="passwordConfirm"
          required
          type="password"
          minLength={6}
          value={passwordConfirm}
          onChange={(e) => {
            setPasswordConfirm(e.target.value);
            if (passwordMismatch) setPasswordMismatch(false);
          }}
          placeholder="Repetir contraseña"
          className={authFieldClass}
        />
        {passwordMismatch ? (
          <p className="text-sm text-rose-600">Las contraseñas no coinciden.</p>
        ) : null}
        <input
          type="text"
          name={HONEYPOT_FIELD_NAME}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        {turnstileSiteKey ? (
          <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
        ) : null}
        <button
          type="submit"
          disabled={loading || (needsTurnstile && !turnstileToken)}
          className={authPrimaryButtonClass}
        >
          {loading ? "Registrando…" : "Crear cuenta con email"}
        </button>
      </form>

      {mensaje ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{mensaje}</p>
      ) : null}
      {devLink ? (
        <p className="mt-2 break-all text-xs text-slate-500">
          Link de verificación (solo entorno local):{" "}
          <a className="text-brand underline" href={devLink}>
            {devLink}
          </a>
        </p>
      ) : null}
    </>
  );
}
