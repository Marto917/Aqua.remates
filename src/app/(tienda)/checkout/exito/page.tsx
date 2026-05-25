import Link from "next/link";

export default function CheckoutExitoPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <h1 className="text-2xl font-bold text-emerald-900">¡Pago recibido!</h1>
      <p className="mt-3 text-sm text-emerald-800">
        Tu pago con Mercado Pago fue procesado. Te contactaremos para coordinar el envío o retiro según lo
        elegiste.
      </p>
      <Link href="/catalog" className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white">
        Seguir comprando
      </Link>
    </div>
  );
}
