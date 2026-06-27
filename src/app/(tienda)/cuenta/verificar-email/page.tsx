import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { getTurnstileSiteKey } from "@/lib/turnstile";

type PageProps = {
  searchParams: Promise<{ estado?: string; email?: string }>;
};

export default async function VerificarEmailPage({ searchParams }: PageProps) {
  const { estado, email } = await searchParams;
  const emailDecoded = email ? decodeURIComponent(email) : "";
  const turnstileSiteKey = getTurnstileSiteKey();

  const mensaje =
    estado === "ok"
      ? "¡Listo! Tu email quedó verificado. Ya podés iniciar sesión y comprar."
      : estado === "expirado"
        ? "El enlace expiró o ya no es válido. Pedí uno nuevo abajo."
        : estado === "error"
          ? "Enlace inválido. Pedí un nuevo mail de verificación."
          : "Revisá tu correo y tocá el enlace que te enviamos para activar tu cuenta.";

  const showResend = estado !== "ok";

  return (
    <section className="mx-auto max-w-lg rounded-xl border bg-white p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-brand-dark">Verificación de email</h1>
      <p className="mt-3 text-sm text-slate-600">{mensaje}</p>

      {showResend ? (
        <ResendVerificationForm
          initialEmail={emailDecoded}
          expired={estado === "expirado"}
          turnstileSiteKey={turnstileSiteKey}
        />
      ) : null}

      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand underline">
        Ir al inicio de sesión
      </Link>
    </section>
  );
}
