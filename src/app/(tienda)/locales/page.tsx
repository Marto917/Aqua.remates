import Link from "next/link";
import { formatWhatsAppHref } from "@/lib/brand-contact";
import { getStoreSettings } from "@/lib/store-settings";

export default async function LocalesPage() {
  const settings = await getStoreSettings();
  const address = settings.storeAddress?.trim();
  const phone = settings.storePhone?.trim() || "1161153502";
  const waHref = formatWhatsAppHref(phone);
  const mapsQuery = address ? encodeURIComponent(address) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">Locales</h1>
        <p className="mt-2 text-sm text-slate-600">
          Encontranos en nuestro punto de atención.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dirección</h2>
        {address ? (
          <p className="mt-3 text-lg font-medium text-slate-900">{address}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Pronto publicaremos la dirección del local. Mientras tanto escribinos por WhatsApp.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe57]"
            >
              WhatsApp
            </a>
          ) : null}
          {mapsQuery ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ver en Google Maps
            </a>
          ) : null}
          <Link
            href="/contacto"
            className="inline-flex rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand/5"
          >
            Contacto
          </Link>
        </div>
      </section>
    </div>
  );
}
