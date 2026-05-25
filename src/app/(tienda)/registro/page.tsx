import Link from "next/link";
import { Suspense } from "react";
import { RegistroForm } from "./RegistroForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export default function RegistroPage() {
  const googleReady = isGoogleAuthConfigured();

  return (
    <AuthPageShell
      title="Creá tu cuenta"
      subtitle="Registrate con Google en un clic o con email. Con Google tu cuenta queda verificada al instante."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-dark hover:underline">
            Ingresar
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <RegistroForm googleReady={googleReady} />
      </Suspense>
    </AuthPageShell>
  );
}
