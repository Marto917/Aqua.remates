import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductAddToCart } from "@/components/ProductAddToCart";
import { PriceModeSwitch } from "@/components/PriceModeSwitch";
import { prisma } from "@/lib/prisma";
import { resolveProductImageUrl } from "@/lib/product-images";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product || !product.isActive || product.variants.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/catalog" className="text-sm font-medium text-brand-dark underline">
          ← Volver al catálogo
        </Link>
        <Suspense fallback={null}>
          <PriceModeSwitch />
        </Suspense>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark">
            {product.category.name}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
          <p className="mt-3 whitespace-pre-wrap text-slate-600">{product.description}</p>
        </div>

        <ProductAddToCart
          product={{
            id: product.id,
            name: product.name,
            imageUrl: resolveProductImageUrl(product.imageUrl),
            retailPrice: product.retailPrice,
            wholesalePrice: product.wholesalePrice,
            discountRetailPercent: product.discountRetailPercent,
            discountWholesalePercent: product.discountWholesalePercent,
          }}
          variants={product.variants.map((v) => ({
            id: v.id,
            colorLabel: v.colorLabel,
            imageUrl: v.imageUrl,
          }))}
        />
      </div>
    </div>
  );
}
