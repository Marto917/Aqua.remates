import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveProductImageUrl } from "@/lib/product-images";
import { prisma } from "@/lib/prisma";
import { isPromoCurrentlyVisible } from "@/lib/store-promo";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PromocionDetallePage({ params }: Props) {
  const { slug } = await params;
  const promo = await prisma.storePromo.findUnique({ where: { slug } });
  if (!promo || !isPromoCurrentlyVisible(promo)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/promociones" className="text-sm font-medium text-brand-dark underline">
        ← Volver a Promociones
      </Link>

      <article className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-slate-700" aria-hidden />
        <div className="space-y-5 px-6 py-8 sm:px-8">
          {promo.logoUrl ? (
            <div className="relative mx-auto h-20 w-full max-w-[220px]">
              <Image
                src={resolveProductImageUrl(promo.logoUrl)}
                alt=""
                fill
                className="object-contain"
                sizes="220px"
                unoptimized
              />
            </div>
          ) : null}
          <h1 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{promo.title}</h1>
          <p className="text-center text-base text-slate-600">{promo.summary}</p>
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Detalle y términos
            </h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-700">{promo.body}</p>
          </div>
          <div className="pt-2 text-center">
            <Link
              href="/catalog"
              className="inline-flex rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
