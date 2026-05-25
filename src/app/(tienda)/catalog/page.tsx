import { CatalogToolbar } from "@/components/CatalogToolbar";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogData } from "@/lib/catalog";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;

  let products: Awaited<ReturnType<typeof getCatalogData>>["products"] = [];

  try {
    const data = await getCatalogData({ q, category });
    products = data.products;
  } catch (error) {
    console.error("No se pudo cargar el catalogo:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Precio de lista y precio con transferencia en cada producto.
        </p>
      </div>

      <CatalogToolbar selectedCategory={category} search={q} />

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <p className="text-sm text-slate-600">No encontramos productos con esos filtros.</p>
        )}
      </div>
    </div>
  );
}
