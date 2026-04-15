import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function VerificarEmailPage({ searchParams }: PageProps) {
  const { estado } = await searchParams;

  const mensaje =
    estado === "ok"
      ? "Email verificado. Ya podés comprar: iniciá sesión de nuevo si hace falta para actualizar la sesión."
      : estado === "expirado"
        ? "El enlace expiró o no es válido. Pedí un nuevo mail de verificación (próximamente) o contactanos."
        : estado === "error"
          ? "Enlace inválido."
          : "Si acabás de registrarte, revisá tu correo y tocá el enlace para activar tu cuenta.";

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
