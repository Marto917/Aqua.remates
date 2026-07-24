import Image from "next/image";
import Link from "next/link";
import { resolveProductImageUrl } from "@/lib/product-images";
import { prisma } from "@/lib/prisma";
import { isPromoCurrentlyVisible } from "@/lib/store-promo";

export default async function PromocionesPage() {
  const all = await prisma.storePromo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const promos = all.filter(isPromoCurrentlyVisible);

  return (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">Promociones</h1>
        <p className="mt-2 text-sm text-slate-600">
          Descuentos, alianzas y beneficios vigentes.
        </p>
      </div>

      {promos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-600">
          <p>Por ahora no hay promociones publicadas.</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => (
            <li
              key={promo.id}
              className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm"
            >
              <div className="h-1 bg-slate-700" aria-hidden />
              <div className="flex flex-1 flex-col px-5 pb-0 pt-6 text-center">
                <div className="mx-auto flex h-16 w-full max-w-[180px] items-center justify-center">
                  {promo.logoUrl ? (
                    <div className="relative h-16 w-full">
                      <Image
                        src={resolveProductImageUrl(promo.logoUrl)}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="180px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
                      AQUA
                    </span>
                  )}
                </div>
                <h2 className="mt-5 text-lg font-bold text-slate-900">{promo.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{promo.summary}</p>
              </div>
              <div className="mt-6 border-t border-slate-100 bg-slate-50 px-5 py-4 text-center">
                <Link
                  href={`/promociones/${promo.slug}`}
                  className="inline-flex min-w-[10rem] items-center justify-center border border-slate-800 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Ver Promoción
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
