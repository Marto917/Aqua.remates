import Image from "next/image";
import Link from "next/link";
import {
  getListingPriceLabel,
  type PriceMode,
} from "@/lib/catalog";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
    category: { name: string };
    variants: { id: string; colorLabel: string }[];
  };
  mode: PriceMode;
};

export function ProductCard({ product, mode }: ProductCardProps) {
  const { main, hint } = getListingPriceLabel(product, mode);
  const colors = product.variants.slice(0, 5);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
    >
      <article>
        <div className="relative h-44 w-full bg-slate-100">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        </div>
        <div className="space-y-2 p-4">
          <span className="inline-flex rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            {product.category.name}
          </span>
          <h3 className="font-semibold leading-snug text-slate-900">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {colors.map((v) => (
                <span
                  key={v.id}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                >
                  {v.colorLabel}
                </span>
              ))}
            </div>
          )}
          <p className="text-lg font-bold text-brand-dark">{main}</p>
          {hint ? <p className="text-[11px] leading-tight text-slate-500">{hint}</p> : null}
        </div>
      </article>
    </Link>
  );
}
