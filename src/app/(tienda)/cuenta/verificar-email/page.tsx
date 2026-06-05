import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function VerificarEmailPage({ searchParams }: PageProps) {
  const { estado } = await searchParams;

  const mensaje =
    estado === "ok"
      ? "¡Listo! Tu email quedó verificado. Ya podés iniciar sesión y comprar."
      : estado === "expirado"
        ? "El enlace expiró o ya no es válido. Registrate de nuevo o contactanos si necesitás ayuda."
        : estado === "error"
          ? "Enlace inválido."
          : "Revisá tu correo y tocá el enlace que te enviamos para activar tu cuenta.";

  return (
    <section className="mx-auto max-w-lg rounded-xl border bg-white p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-brand-dark">Verificación de email</h1>
      <p className="mt-3 text-sm text-slate-600">{mensaje}</p>
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand underline">
        Ir al inicio de sesión
      </Link>
    </section>
  );
}
