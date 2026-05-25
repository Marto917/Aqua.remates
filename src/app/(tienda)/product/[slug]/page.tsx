import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductAddToCart } from "@/components/ProductAddToCart";
import { ProductReviews } from "@/components/ProductReviews";
import { formatDisplayWords } from "@/lib/display-text";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSafeSession();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!product || !product.isActive || product.variants.length === 0) {
    notFound();
  }

  const title = formatDisplayWords(product.name);
  const desc = formatDisplayWords(product.description);
  const categoryLabel = formatDisplayWords(product.category.name);

  const initialReviews = product.reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));

  const reviewCount = initialReviews.length;
  const reviewAverage =
    reviewCount > 0
      ? initialReviews.reduce((a, r) => a + r.rating, 0) / reviewCount
      : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/catalog" className="text-sm font-medium text-brand-dark underline">
          ← Volver al catálogo
        </Link>
      </div>

      <ProductAddToCart
        product={{
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          imagePosition: product.imagePosition,
          listPrice: product.listPrice,
          retailPrice: product.retailPrice,
          discountRetailPercent: product.discountRetailPercent,
          discountBadgeLabel: product.discountBadgeLabel,
          imageScale: product.imageScale,
        }}
        variants={product.variants.map((v) => ({
          id: v.id,
          colorLabel: v.colorLabel,
          imageUrl: v.imageUrl,
          imagePosition: v.imagePosition,
        }))}
        categoryLabel={categoryLabel}
        title={title}
        shortDescription={desc}
        reviewAverage={reviewAverage}
        reviewCount={reviewCount}
      />

      <section className="rounded-xl border border-slate-100 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-900">Descripción</h2>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-600">{desc}</p>
      </section>

      <ProductReviews
        productId={product.id}
        initialReviews={initialReviews}
        session={session}
      />
    </div>
  );
}
