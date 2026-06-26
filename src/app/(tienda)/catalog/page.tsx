import { CatalogPagination } from "@/components/CatalogPagination";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogData } from "@/lib/catalog";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parsePriceParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parsePageParam(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !value.trim()) return 1;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const priceMode = typeof params.priceMode === "string" ? params.priceMode : undefined;
  const minPrice = parsePriceParam(params.minPrice);
  const maxPrice = parsePriceParam(params.maxPrice);
  const minPriceStr = typeof params.minPrice === "string" ? params.minPrice : undefined;
  const maxPriceStr = typeof params.maxPrice === "string" ? params.maxPrice : undefined;
  const page = parsePageParam(params.page);
  const audience = priceMode === "wholesale" ? "wholesale" : "retail";

  let products: Awaited<ReturnType<typeof getCatalogData>>["products"] = [];
  let total = 0;
  let currentPage = 1;
  let totalPages = 1;

  const catalogQuery = {
    q,
    category,
    minPrice: minPriceStr,
    maxPrice: maxPriceStr,
    priceMode,
  };

  try {
    const data = await getCatalogData({ q, category, audience, minPrice, maxPrice, page });
    products = data.products;
    total = data.total;
    currentPage = data.page;
    totalPages = data.totalPages;
  } catch (error) {
    console.error("No se pudo cargar el catalogo:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-600">Explorá por categoría, precio o buscá por nombre.</p>
      </div>

      <CatalogToolbar
        selectedCategory={category}
        search={q}
        minPrice={minPriceStr}
        maxPrice={maxPriceStr}
      />

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
        {products.length > 0 ? (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <p className="col-span-full text-sm text-slate-600">No encontramos productos con esos filtros.</p>
        )}
      </div>

      <CatalogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        query={catalogQuery}
      />
    </div>
  );
}
