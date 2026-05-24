import { Suspense } from "react";
import { StaffLoginForm } from "./StaffLoginForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function StaffLoginPage() {
  return (
    <AuthPageShell
      variant="staff"
      title="Acceso interno"
      subtitle="Ingreso para administración y vendedores. Usá las credenciales que te asignó el dueño."
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <StaffLoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
