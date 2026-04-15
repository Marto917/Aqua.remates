import { BANK_TRANSFER } from "@/lib/constants";

export default function CheckoutPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="mb-4 text-2xl font-semibold">Checkout Minorista (B2C)</h1>
        <form method="post" action="/api/retail-orders" className="space-y-3">
          <input
            name="buyerName"
            required
            placeholder="Nombre completo"
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            name="buyerEmail"
            required
            type="email"
            placeholder="Email"
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            name="buyerPhone"
            placeholder="Telefono (opcional)"
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            name="totalAmount"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Monto total de tu compra"
            className="w-full rounded-md border px-3 py-2"
          />
          <textarea
            name="notes"
            rows={3}
            placeholder="Notas adicionales (opcional)"
            className="w-full rounded-md border px-3 py-2"
          />
          <button type="submit" className="rounded-md bg-brand px-4 py-2 text-white">
            Confirmar pedido por transferencia
          </button>
        </form>
      </section>

      <aside className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Datos de transferencia bancaria</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <strong>Titular:</strong> {BANK_TRANSFER.holder}
          </li>
          <li>
            <strong>Alias:</strong> {BANK_TRANSFER.alias}
          </li>
          <li>
            <strong>CBU:</strong> {BANK_TRANSFER.cbu}
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-600">
          Una vez realizada la transferencia, el equipo valida el pago y confirma la venta manualmente.
        </p>
      </aside>
    </div>
  );
}
