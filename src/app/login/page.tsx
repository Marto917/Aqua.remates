import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Acceso al backoffice</h1>
      <p className="mb-4 text-sm text-slate-600">
        Empleados y dueño ingresan aquí con email, contraseña y clave de sucursal.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
