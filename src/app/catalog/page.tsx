import { Suspense } from "react";
import { CatalogPriceModeSync } from "@/components/CatalogPriceModeSync";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { PriceModeSwitch } from "@/components/PriceModeSwitch";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogData, type PriceMode } from "@/lib/catalog";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const priceMode: PriceMode = params.priceMode === "wholesale" ? "wholesale" : "retail";

  let products: Awaited<ReturnType<typeof getCatalogData>>["products"] = [];
  let categories: Awaited<ReturnType<typeof getCatalogData>>["categories"] = [];

  try {
    const data = await getCatalogData({ q, category, priceMode });
    products = data.products;
    categories = data.categories;
  } catch (error) {
    console.error("No se pudo cargar el catalogo:", error);
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <CatalogPriceModeSync />
      </Suspense>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-dark">Catálogo</h1>
        <Suspense fallback={null}>
          <PriceModeSwitch />
        </Suspense>
      </div>

      <CatalogToolbar
        categories={categories}
        selectedCategory={category}
        search={q}
        priceMode={priceMode}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} mode={priceMode} />)
        ) : (
          <p className="text-sm text-slate-600">No encontramos productos con esos filtros.</p>
        )}
      </div>
    </div>
  );
}
