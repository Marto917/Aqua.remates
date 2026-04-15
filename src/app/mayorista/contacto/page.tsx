import Link from "next/link";

export default function WholesaleContactPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
      <h1 className="mb-2 text-2xl font-semibold">Compra mayorista</h1>
      <p className="mb-4 text-sm text-slate-600">
        Las solicitudes mayoristas se arman desde el carrito: activá el modo mayorista arriba, agregá productos y al
        finalizar se crea la solicitud para que un vendedor te contacte con el detalle de ítems y cantidades.
      </p>
      <Link href="/catalog" className="inline-flex rounded-md bg-brand px-4 py-2 text-white">
        Ir al catálogo
      </Link>
    </section>
  );
}
