import Image from "next/image";
import Link from "next/link";
import { type Prisma as PrismaTypes } from "@prisma/client";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { HomeHeroSearch } from "@/components/home/HomeHeroSearch";
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

  try {
    [categories, homeProducts, carouselBanners, promoBanners] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.banner.findMany({
        where: { isActive: true, sortOrder: { lt: 1000 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 5,
        select: { id: true, title: true, imageUrl: true, linkUrl: true },
      }),
      prisma.banner.findMany({
        where: { isActive: true, sortOrder: { gte: 1000 } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 4,
        select: { id: true, title: true, imageUrl: true, linkUrl: true },
      }),
    ]);
  } catch (error) {
    console.error("No se pudieron cargar datos del home:", error);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-teal-100/80 bg-gradient-to-b from-white via-white to-brand-muted/50 shadow-sm">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgb(255_255_255/0.5)_50%,transparent_100%)] opacity-40"
          aria-hidden
        />

        <div className="relative z-10 grid gap-8 px-4 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-center lg:gap-12">
          <div className="text-center sm:text-left">
            <p className="flex justify-center sm:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
                Bazar y hogar
              </span>
            </p>
            <h1 className="mt-4 text-balance text-2xl font-bold leading-[1.2] tracking-tight text-slate-900 min-[400px]:text-3xl sm:text-4xl sm:leading-[1.15] lg:text-[2.5rem]">
              Todo para tu casa, <span className="text-brand-dark">en un solo lugar</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-slate-600 sm:mx-0 sm:text-lg">
              Navegá el catálogo con precios minoristas o activá el modo mayorista y armá tu pedido como en un
              comercio online.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 min-[420px]:flex-row min-[420px]:flex-wrap sm:justify-start">
              <Link
                href="/catalog?priceMode=retail"
                className="inline-flex min-h-12 w-full min-[420px]:w-auto items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 active:bg-brand-dark sm:min-h-0 sm:py-2.5 sm:hover:bg-brand-dark"
              >
                Ver catálogo
              </Link>
              <Link
                href="/catalog?priceMode=wholesale"
                className="inline-flex min-h-12 w-full min-[420px]:w-auto min-[420px]:flex-1 items-center justify-center rounded-full border-2 border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm active:bg-slate-50 sm:min-h-0 sm:min-w-0 sm:flex-none sm:py-2.5 sm:hover:border-brand/40 sm:hover:bg-brand-muted/50"
              >
                Soy comercio — mayorista
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[260px] lg:mx-0 lg:block" aria-hidden>
            <div className="absolute inset-0 rotate-3 rounded-3xl bg-gradient-to-br from-brand/20 to-teal-100/60" />
            <div className="relative flex aspect-[4/5] flex-col justify-between rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl shadow-teal-900/10 backdrop-blur">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Comprá fácil</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">Carrito y checkout claros</p>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-3/4 rounded-full bg-brand/30" />
                <div className="h-2.5 w-full rounded-full bg-slate-100" />
                <div className="h-2.5 w-5/6 rounded-full bg-slate-100" />
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-3 text-center text-sm font-semibold text-white">
                AQUA — calidad y variedad
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="mx-auto max-w-md sm:mx-0 sm:max-w-none">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Novedades</h2>
            <p className="mt-1.5 text-balance text-sm text-slate-500">
              Los productos actualizados más recientes — tu último ingreso aparece acá
            </p>
          </div>
          <Link
            href="/catalog?priceMode=retail"
            className="group inline-flex min-h-11 items-center justify-center gap-1 self-center text-sm font-semibold text-brand-dark sm:self-start"
          >
            Ver catálogo completo
            <span className="transition group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {homeProducts.length > 0 ? (
            homeProducts.map((product) => <ProductCard key={product.id} product={product} mode="retail" />)
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 px-6 py-12 text-center text-slate-600">
              Aún no hay productos. Podés usar{" "}
              <Link href="/setup-demo" className="font-semibold text-brand-dark underline decoration-brand/30 underline-offset-2">
                /setup-demo
              </Link>{" "}
              o <span className="font-medium">npm run db:seed</span>, o cargar desde el panel en{" "}
              <Link href="/admin/productos" className="font-semibold text-brand-dark underline decoration-brand/30 underline-offset-2">
                Admin → productos
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100/80 bg-gradient-to-b from-white to-brand-muted/30 p-5 shadow-sm sm:p-6">
        <p className="mb-3 text-center text-sm font-medium text-slate-600">Buscar en el catálogo</p>
        <HomeHeroSearch />
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2.5 text-xs text-slate-600 sm:text-sm">
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
            Atención a mayoristas
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100/80">
            <span className="text-brand-dark" aria-hidden>
              ✓
            </span>
            Pagos por transferencia
          </span>
        </div>
      </section>

      <PromoCarousel
        slides={carouselBanners.map((b) => ({
          id: b.id,
          title: b.title ?? "Promoción",
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
        }))}
      />

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
            Modo mayorista, carrito y solicitud. Un vendedor te contacta para cerrar el pedido.
          </p>
          <Link
            href="/catalog?priceMode=wholesale"
            className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-brand-dark underline-offset-4 sm:inline sm:w-auto sm:justify-start sm:hover:underline"
          >
            Ir al catálogo mayorista →
          </Link>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 text-center shadow-sm transition hover:shadow-md sm:text-left">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-100/80 transition group-hover:bg-cyan-200/60" aria-hidden />
          <h3 className="relative text-lg font-bold text-slate-900">¿Compras para tu casa?</h3>
          <p className="relative mt-2 text-balance text-sm leading-relaxed text-slate-600">
            Precio minorista claro, pago por transferencia y retiro o envío coordinado.
          </p>
          <Link
            href="/catalog?priceMode=retail"
            className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-brand-dark underline-offset-4 sm:inline sm:w-auto sm:justify-start sm:hover:underline"
          >
            Comprar minorista →
          </Link>
        </div>
      </section>
    </div>
  );
}
