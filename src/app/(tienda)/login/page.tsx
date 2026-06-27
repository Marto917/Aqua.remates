import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export default function LoginPage() {
  const googleReady = isGoogleAuthConfigured();
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <AuthPageShell
      title="Bienvenido de nuevo"
      subtitle="Ingresá a tu cuenta para comprar, ver pedidos mayoristas y finalizar checkout más rápido."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-dark hover:underline">
            Crear cuenta gratis
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm googleReady={googleReady} turnstileSiteKey={turnstileSiteKey} />
      </Suspense>
    </AuthPageShell>
  );
}
