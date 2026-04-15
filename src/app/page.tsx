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

export default async function HomePage() {
  let homeProducts: HomeProduct[] = [];
  let categories: { name: string; slug: string }[] = [];

  try {
    const [idRows, cats] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM "Product" WHERE "isActive" = true ORDER BY RANDOM() LIMIT 4`,
      ),
      prisma.category.findMany({ orderBy: { name: "asc" }, take: 12 }),
    ]);
    categories = cats;

    if (idRows.length > 0) {
      const ids = idRows.map((r) => r.id);
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
    <div className="space-y-8">
      {/* Hero estilo marketplace: mensaje + búsqueda grande */}
      <section className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-white to-brand-muted/40 px-4 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">Bazar y hogar</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Todo para tu casa, en un solo lugar
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Minorista o mayorista: elegí el modo arriba en el catálogo y comprá como en un supermercado online.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <HomeHeroSearch />
        </div>
        <div className="mx-auto mt-6 flex flex-wrap justify-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">✓ Retiro / envío según zona</span>
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">✓ Mayorista con asesoramiento</span>
        </div>
      </section>

      <PromoCarousel />

      <CategoryStrip categories={categories} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Descubrí hoy</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuatro productos al azar del catálogo (cambian al recargar la página)
            </p>
          </div>
          <Link
            href="/catalog?priceMode=retail"
            className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
          >
            Ver todo el catálogo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {homeProducts.length > 0 ? (
            homeProducts.map((product) => <ProductCard key={product.id} product={product} mode="retail" />)
          ) : (
            <p className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
              Todavía no hay productos destacados. Entrá al{" "}
              <Link href="/admin/productos" className="font-medium text-brand underline">
                panel de empleado
              </Link>{" "}
              para cargar el catálogo.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold text-slate-900">¿Sos comercio?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Activá modo mayorista, cargá el carrito y envianos la solicitud. Un vendedor te contacta.
          </p>
          <Link
            href="/catalog?priceMode=wholesale"
            className="mt-3 inline-block text-sm font-semibold text-brand-dark underline"
          >
            Ir al catálogo mayorista
          </Link>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">¿Compra personal?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Pagá por transferencia y coordinamos el retiro o envío.
          </p>
          <Link href="/catalog" className="mt-3 inline-block text-sm font-semibold text-brand-dark underline">
            Comprar minorista
          </Link>
        </div>
      </section>
    </div>
  );
}
