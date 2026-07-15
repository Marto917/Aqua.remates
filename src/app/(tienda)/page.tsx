import Image from "next/image";
import Link from "next/link";
import { type Prisma as PrismaTypes } from "@prisma/client";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { HomeHeroBanner } from "@/components/home/HomeHeroPromo";
import { HomeHeroSearch } from "@/components/home/HomeHeroSearch";
import { catalogVisibilityWhere } from "@/lib/catalog-visibility";
import { getHeroPromoSettings } from "@/lib/hero-promo";
import { ProductCard } from "@/components/ProductCard";
import { PromoCarousel } from "@/components/PromoCarousel";
import { prisma } from "@/lib/prisma";
import { resolveProductImageUrl } from "@/lib/product-images";

type HomeProduct = PrismaTypes.ProductGetPayload<{
  include: { category: true; variants: true };
}>;

export default async function HomePage() {
  let homeProducts: HomeProduct[] = [];
  let categories: { name: string; slug: string }[] = [];
  let carouselBanners: Array<{ id: string; title: string | null; imageUrl: string; linkUrl: string | null }> = [];
  let promoBanners: Array<{ id: string; title: string | null; imageUrl: string; linkUrl: string | null }> = [];
  let heroPromo = { desktopImageUrl: null as string | null, mobileImageUrl: null as string | null, linkUrl: null as string | null };

  try {
    [categories, homeProducts, carouselBanners, promoBanners, heroPromo] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 }),
      prisma.product.findMany({
        where: { isActive: true, ...catalogVisibilityWhere("retail") },
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.banner.findMany({
        where: { isActive: true, sortOrder: { lt: 1000 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, title: true, imageUrl: true, linkUrl: true },
      }),
      prisma.banner.findMany({
        where: { isActive: true, sortOrder: { gte: 1000 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 4,
        select: { id: true, title: true, imageUrl: true, linkUrl: true },
      }),
      getHeroPromoSettings(),
    ]);
  } catch (error) {
    console.error("No se pudieron cargar datos del home:", error);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <HomeHeroBanner hero={heroPromo} />

      <section id="buscar" className="scroll-mt-28 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5">
        <HomeHeroSearch />
      </section>

      {carouselBanners.length > 0 ? (
        <PromoCarousel
          slides={carouselBanners.map((b) => ({
            id: b.id,
            title: b.title,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl,
          }))}
        />
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="mx-auto max-w-md sm:mx-0 sm:max-w-none">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Últimos lanzamientos</h2>
            <p className="mt-1.5 text-balance text-sm text-slate-500">
              Los artículos más recientes del catálogo
            </p>
          </div>
          <Link
            href="/catalog"
            className="group inline-flex min-h-11 items-center justify-center gap-1 self-center text-sm font-semibold text-brand-dark sm:self-start"
          >
            Ver catálogo completo
            <span className="transition group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {homeProducts.length > 0 ? (
            homeProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 px-6 py-12 text-center text-slate-600">
              Próximamente vas a ver novedades acá. Volvé a visitarnos en unos días.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100/80 bg-gradient-to-b from-white to-brand-muted/30 p-5 shadow-sm sm:p-6">
        <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2.5 text-xs text-slate-600 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100/80">
            <span className="text-brand-dark" aria-hidden>
              ✓
            </span>
            Retiro o envío según zona
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100/80">
            <span className="text-brand-dark" aria-hidden>
              ✓
            </span>
            Atención personalizada
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100/80">
            <span className="text-brand-dark" aria-hidden>
              ✓
            </span>
            Pagos por transferencia
          </span>
        </div>
      </section>

      {promoBanners.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Promos destacadas</h3>
            <p className="text-xs text-slate-500">Sección promocional del home</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {promoBanners.map((banner) => {
              const card = (
                <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-24 w-full sm:h-28">
                    <Image
                      src={resolveProductImageUrl(banner.imageUrl)}
                      alt={banner.title ?? "Promo"}
                      fill
                      className="object-cover"
                      unoptimized={banner.imageUrl.startsWith("http")}
                    />
                  </div>
                  {banner.title ? (
                    <p className="px-2 py-2 text-center text-xs font-medium text-slate-700">
                      {banner.title}
                    </p>
                  ) : null}
                </article>
              );

              if (banner.linkUrl) {
                return (
                  <Link key={banner.id} href={banner.linkUrl} className="block">
                    {card}
                  </Link>
                );
              }
              return <div key={banner.id}>{card}</div>;
            })}
          </div>
        </section>
      ) : null}

      <CategoryStrip categories={categories} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-brand-muted/40 p-6 text-center shadow-sm transition hover:shadow-md sm:text-left">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/15 transition group-hover:bg-brand/25" aria-hidden />
          <h3 className="relative text-lg font-bold text-slate-900">¿Sos comercio?</h3>
          <p className="relative mt-2 text-balance text-sm leading-relaxed text-slate-600">
            Estamos preparando una experiencia dedicada para compras comerciales.
          </p>
          <button
            type="button"
            disabled
            className="relative mt-5 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500 sm:w-auto"
          >
            Próximamente: mayorista
          </button>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 text-center shadow-sm transition hover:shadow-md sm:text-left">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-100/80 transition group-hover:bg-cyan-200/60" aria-hidden />
          <h3 className="relative text-lg font-bold text-slate-900">¿Compras para tu casa?</h3>
          <p className="relative mt-2 text-balance text-sm leading-relaxed text-slate-600">
            Precio minorista claro, pago por transferencia y retiro o envío coordinado.
          </p>
          <Link
            href="/catalog"
            className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-brand-dark underline-offset-4 sm:inline sm:w-auto sm:justify-start sm:hover:underline"
          >
            Comprar minorista →
          </Link>
        </div>
      </section>
    </div>
  );
}
