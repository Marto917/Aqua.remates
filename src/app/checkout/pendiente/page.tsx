import Link from "next/link";

export default function CheckoutPendientePage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
      <h1 className="text-2xl font-bold text-amber-900">Pago pendiente</h1>
      <p className="mt-3 text-sm text-amber-800">
        Mercado Pago está procesando tu pago. Cuando se acredite, actualizaremos el pedido automáticamente.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-brand-dark underline">
        Volver al inicio
      </Link>
    </div>
  );
}
