import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Acceso al backoffice</h1>
      <p className="mb-4 text-sm text-slate-600">
        Empleados y duenio ingresan aqui para administrar el catalogo.
      </p>
      <LoginForm />
    </section>
  );
}
