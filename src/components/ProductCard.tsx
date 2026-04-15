import Image from "next/image";
import { getProductDisplayPrice, type PriceMode } from "@/lib/catalog";

type ProductCardProps = {
  product: {
    name: string;
    description: string;
    imageUrl: string;
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountPercent: number;
    category: { name: string };
  };
  mode: PriceMode;
};

export function ProductCard({ product, mode }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="relative h-44 w-full">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
      </div>
      <div className="space-y-2 p-4">
        <span className="inline-flex rounded bg-slate-100 px-2 py-1 text-xs">{product.category.name}</span>
        <h3 className="font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <p className="text-lg font-bold text-brand">{getProductDisplayPrice(product, mode)}</p>
        {product.discountPercent > 0 && (
          <p className="text-xs text-emerald-700">Incluye {product.discountPercent}% de descuento</p>
        )}
      </div>
    </article>
  );
}
