import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/app/login/LoginForm";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-2 text-xl font-semibold">Ingresar</h1>
      <p className="mb-4 text-sm text-slate-600">
        Clientes pueden usar Google o email. Empleados y dueño: email, contraseña y clave de sucursal.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-brand underline">
          Registrarte
        </Link>
      </p>
    </section>
  );
}
