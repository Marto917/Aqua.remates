import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <h1 className="text-2xl font-bold text-rose-900">No se completó el pago</h1>
      <p className="mt-3 text-sm text-rose-800">
        El pago fue cancelado o rechazado. Podés volver al carrito e intentar de nuevo.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/carrito" className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white">
          Ir al carrito
        </Link>
        <Link href="/checkout" className="text-sm font-medium text-brand-dark underline">
          Reintentar checkout
        </Link>
      </div>
    </div>
  );
}
