import Link from "next/link";
import { formatWhatsAppHref, normalizeSocialUrl } from "@/lib/brand-contact";
import { getStoreSettings } from "@/lib/store-settings";

export default async function ContactoPage() {
  const settings = await getStoreSettings();
  const phone = settings.storePhone?.trim() || "1161153502";
  const waHref = formatWhatsAppHref(phone);
  const address = settings.storeAddress?.trim();
  const instagram =
    normalizeSocialUrl(settings.storeInstagram, "instagram") ??
    "https://www.instagram.com/aqua.remates/";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">Contacto</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escribinos por WhatsApp o seguinos en redes. Te respondemos a la brevedad.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Teléfono</h2>
          <p className="mt-1 text-lg font-medium text-slate-900">{phone}</p>
        </div>
        {address ? (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dirección</h2>
            <p className="mt-1 text-slate-800">{address}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe57]"
            >
              Escribir por WhatsApp
            </a>
          ) : null}
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Instagram
          </a>
          <Link
            href="/locales"
            className="inline-flex rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand/5"
          >
            Ver locales
          </Link>
        </div>
      </section>
    </div>
  );
}
