import { Suspense } from "react";
import { RegistroForm } from "./RegistroForm";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

export default function RegistroPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-500">Cargando...</p>}>
      <RegistroForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
