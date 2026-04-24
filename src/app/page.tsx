import { randomInt } from "crypto";
import Link from "next/link";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { HomeHeroSearch } from "@/components/home/HomeHeroSearch";
import { ProductCard } from "@/components/ProductCard";
import { PromoCarousel } from "@/components/PromoCarousel";
import { prisma } from "@/lib/prisma";

type HomeProduct = PrismaTypes.ProductGetPayload<{
  include: { category: true; variants: true };
}>;

function shuffleIds(ids: string[]): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export default async function HomePage() {
  let homeProducts: HomeProduct[] = [];
  let categories: { name: string; slug: string }[] = [];

  try {
    categories = await prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 });

    let ids: string[] = [];
    try {
      const idRows = await prisma.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM "Product" WHERE "isActive" = true ORDER BY RANDOM() LIMIT 4`,
      );
      ids = idRows.map((r) => r.id);
    } catch (rawErr) {
      console.warn("[home] ORDER BY RANDOM no disponible o falló, usando mezcla en memoria:", rawErr);
    }

    if (ids.length === 0) {
      const pool = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true },
        take: 40,
        orderBy: { updatedAt: "desc" },
      });
      ids = shuffleIds(pool.map((p) => p.id)).slice(0, 4);
    }

    if (ids.length > 0) {
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      const fetched = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      });
      homeProducts = [...fetched].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      );
    }
  } catch (error) {
    console.error("No se pudieron cargar datos del home:", error);
  }

  return (
    <div className="space-y-10 sm:space-y-12">
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

        <div className="relative z-10 grid gap-10 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-center lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
              Bazar y hogar
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem]">
              Todo para tu casa, <span className="text-brand-dark">en un solo lugar</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Navegá el catálogo con precios minoristas o activá el modo mayorista y armá tu pedido como en un
              comercio online.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalog?priceMode=retail"
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
              >
                Ver catálogo
              </Link>
              <Link
                href="/catalog?priceMode=wholesale"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand/40 hover:bg-brand-muted/50"
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

        <div className="relative z-10 border-t border-slate-100/80 bg-white/40 px-5 py-8 backdrop-blur-sm sm:px-8">
          <p className="mb-4 text-center text-sm font-medium text-slate-500">Buscar en el catálogo</p>
          <HomeHeroSearch />
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2.5 text-xs text-slate-600 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              <span className="text-brand-dark" aria-hidden>
                ✓
              </span>
              Retiro o envío según zona
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              <span className="text-brand-dark" aria-hidden>
                ✓
              </span>
              Atención a mayoristas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              <span className="text-brand-dark" aria-hidden>
                ✓
              </span>
              Pagos por transferencia
            </span>
          </div>
        </div>
      </section>

      <PromoCarousel />

      <CategoryStrip categories={categories} />

      <section className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Descubrí hoy</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Una muestra al azar del catálogo — se renueva al recargar
            </p>
          </div>
          <Link
            href="/catalog?priceMode=retail"
            className="group inline-flex items-center gap-1 self-start text-sm font-semibold text-brand-dark"
          >
            Ver todo
            <span className="transition group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-brand-muted/40 p-6 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/15 transition group-hover:bg-brand/25" aria-hidden />
          <h3 className="relative text-lg font-bold text-slate-900">¿Sos comercio?</h3>
          <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
            Modo mayorista, carrito y solicitud. Un vendedor te contacta para cerrar el pedido.
          </p>
          <Link
            href="/catalog?priceMode=wholesale"
            className="relative mt-5 inline-flex items-center text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
          >
            Ir al catálogo mayorista →
          </Link>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition hover:shadow-md">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-100/80 transition group-hover:bg-cyan-200/60" aria-hidden />
          <h3 className="relative text-lg font-bold text-slate-900">¿Compras para tu casa?</h3>
          <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
            Precio minorista claro, pago por transferencia y retiro o envío coordinado.
          </p>
          <Link
            href="/catalog?priceMode=retail"
            className="relative mt-5 inline-flex items-center text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
          >
            Comprar minorista →
          </Link>
        </div>
      </section>
    </div>
  );
}
