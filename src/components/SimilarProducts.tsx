import { ProductCard } from "@/components/ProductCard";
import { formatDisplayWords } from "@/lib/display-text";

type SimilarProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  imagePosition?: string | null;
  imageScale?: unknown;
  listPrice: unknown;
  categoryId: string;
  variants: {
    id: string;
    colorLabel: string;
    imageUrl?: string | null;
    imagePosition?: string | null;
    imageScale?: unknown;
    images?: { imageUrl: string; imagePosition?: string | null; imageScale?: unknown }[];
  }[];
};

type Props = {
  categoryName: string;
  products: SimilarProduct[];
};

export function SimilarProducts({ categoryName, products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-slate-100 pt-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Otros productos de la misma categoría
        </h2>
        <div className="mt-2 h-1 w-16 rounded-full bg-brand" aria-hidden />
        <p className="mt-2 text-sm text-slate-500">{formatDisplayWords(categoryName)}</p>
      </div>
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="w-[46vw] shrink-0 sm:w-auto sm:shrink">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
