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

  const { products, categories } = await getCatalogData({ q, category, priceMode });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Catalogo de productos</h1>
        <PriceModeSwitch value={priceMode} />
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
