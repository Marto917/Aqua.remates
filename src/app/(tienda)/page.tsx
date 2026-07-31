import Link from "next/link";
import { type Prisma as PrismaTypes } from "@prisma/client";
import { HomeHeroBanner } from "@/components/home/HomeHeroPromo";
import { HomeHeroSearch } from "@/components/home/HomeHeroSearch";
import { HomePromoRibbon } from "@/components/home/HomePromoRibbon";
import { catalogVisibilityWhere } from "@/lib/catalog-visibility";
import { ProductCard } from "@/components/ProductCard";
import { PromoCarousel } from "@/components/PromoCarousel";
import { getHeroPromoSettings } from "@/lib/hero-promo";
import { prisma } from "@/lib/prisma";

type HomeProduct = PrismaTypes.ProductGetPayload<{
  include: {
    category: true;
    variants: { include: { images: true } };
  };
}>;

const FIRST_ROW = 5;
const REST_COUNT = 20;

export default async function HomePage() {
  let homeProducts: HomeProduct[] = [];
  let carouselBanners: Array<{ id: string; title: string | null; imageUrl: string; linkUrl: string | null }> = [];
  let ribbon: { imageUrl: string | null; linkUrl: string | null } = { imageUrl: null, linkUrl: null };
  let hero: Awaited<ReturnType<typeof getHeroPromoSettings>> = {
    desktopImageUrl: null,
    mobileImageUrl: null,
    linkUrl: null,
  };

  try {
    const [products, carousel, settings, heroSettings] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, ...catalogVisibilityWhere("retail") },
        orderBy: { updatedAt: "desc" },
        take: FIRST_ROW + REST_COUNT,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: { images: { orderBy: { sortOrder: "asc" }, take: 8 } },
          },
        },
      }),
      prisma.banner.findMany({
        where: { isActive: true, sortOrder: { lt: 1000 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, title: true, imageUrl: true, linkUrl: true },
      }),
      prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { homeRibbonImageUrl: true, homeRibbonLinkUrl: true },
      }),
      getHeroPromoSettings(),
    ]);
    homeProducts = products;
    carouselBanners = carousel;
    ribbon = {
      imageUrl: settings?.homeRibbonImageUrl ?? null,
      linkUrl: settings?.homeRibbonLinkUrl ?? null,
    };
    hero = heroSettings;
  } catch (error) {
    console.error("No se pudieron cargar datos del home:", error);
  }

  const firstRow = homeProducts.slice(0, FIRST_ROW);
  const rest = homeProducts.slice(FIRST_ROW);

  return (
    <div className="space-y-8 sm:space-y-10">
      <HomeHeroBanner hero={hero} />

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

      <section id="buscar" className="scroll-mt-28 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5">
        <HomeHeroSearch />
      </section>

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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {firstRow.length > 0 ? (
            firstRow.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 px-6 py-12 text-center text-slate-600">
              Próximamente vas a ver novedades acá. Volvé a visitarnos en unos días.
            </p>
          )}
        </div>
      </section>

      {ribbon.imageUrl ? (
        <HomePromoRibbon imageUrl={ribbon.imageUrl} linkUrl={ribbon.linkUrl} />
      ) : null}

      {rest.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Más destacados</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

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
