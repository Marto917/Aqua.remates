import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductCard } from "@/components/ProductCard";
import { PromoCarousel } from "@/components/PromoCarousel";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let bestSellers: Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>[] = [];
  try {
    bestSellers = await prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("No se pudieron cargar productos destacados:", error);
  }

  return (
    <div className="space-y-8">
      <PromoCarousel />

      <section className="rounded-xl border bg-white p-5">
        <h1 className="mb-4 text-2xl font-semibold">Tienda personalizada B2C/B2B</h1>
        <form action="/catalog" className="flex gap-2">
          <input
            name="q"
            placeholder="Buscador global de productos"
            className="w-full rounded-md border px-3 py-2"
          />
          <input type="hidden" name="priceMode" value="retail" />
          <button className="rounded-md bg-brand px-4 py-2 text-white" type="submit">
            Buscar
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Productos mas vendidos</h2>
          <Link href="/catalog" className="text-sm text-brand underline">
            Ver catalogo completo
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {bestSellers.length > 0 ? (
            bestSellers.map((product) => <ProductCard key={product.id} product={product} mode="retail" />)
          ) : (
            <p className="text-sm text-slate-600">Aun no hay productos destacados.</p>
          )}
        </div>
      </section>
    </div>
  );
}
