export default function WholesaleContactPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
      <h1 className="mb-2 text-2xl font-semibold">Formulario Mayorista (B2B)</h1>
      <p className="mb-4 text-sm text-slate-600">
        Al enviar este formulario, se registra una notificacion para que un empleado te contacte.
      </p>
      <form method="post" action="/api/wholesale-contact" className="space-y-3">
        <input
          name="companyName"
          required
          placeholder="Empresa"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          name="contactName"
          required
          placeholder="Nombre del contacto"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          name="email"
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2"
        />
        <input name="phone" placeholder="Telefono" className="w-full rounded-md border px-3 py-2" />
        <textarea
          name="requestedInfo"
          rows={5}
          required
          placeholder="Contanos volumen estimado, rubro y necesidades"
          className="w-full rounded-md border px-3 py-2"
        />
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-white">
          Enviar solicitud mayorista
        </button>
      </form>
    </section>
  );
}
