import { notFound } from "next/navigation";
import { BackToCatalogLink } from "@/components/BackToCatalogLink";
import { ProductAddToCart } from "@/components/ProductAddToCart";
import { ProductReviews } from "@/components/ProductReviews";
import { formatDisplayWords } from "@/lib/display-text";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { isProductVisibleToAudience } from "@/lib/catalog-visibility";
import { canCustomerReview, reviewEligibilityMessage } from "@/lib/review-eligibility";
import { UserRole } from "@prisma/client";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ priceMode?: string }>;
};

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const audience = sp.priceMode === "wholesale" ? "wholesale" : "retail";
  const session = await getSafeSession();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (
    !product ||
    !product.isActive ||
    product.variants.length === 0 ||
    !isProductVisibleToAudience(product.catalogVisibility, audience)
  ) {
    notFound();
  }

  const title = formatDisplayWords(product.name);
  const desc = formatDisplayWords(product.description);
  const categoryLabel = formatDisplayWords(product.category.name);

  const buyerRows = await prisma.retailOrderItem.findMany({
    where: {
      productId: product.id,
      order: { status: { in: ["CONFIRMED", "PAYMENT_APPROVED"] } },
    },
    select: { order: { select: { customerId: true } } },
  });
  const verifiedBuyerIds = new Set(
    buyerRows.map((row) => row.order.customerId).filter(Boolean) as string[],
  );

  const initialReviews = product.reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    pros: r.pros,
    cons: r.cons,
    recommends: r.recommends,
    isVerifiedBuyer: Boolean(r.userId && verifiedBuyerIds.has(r.userId)),
    createdAt: r.createdAt.toISOString(),
  }));

  const reviewCount = initialReviews.length;
  const reviewAverage =
    reviewCount > 0
      ? initialReviews.reduce((a, r) => a + r.rating, 0) / reviewCount
      : null;

  let canReview = false;
  let reviewBlockedMessage: string | undefined;
  if (session?.user?.id && session.user.role === UserRole.CUSTOMER) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });
    if (dbUser) {
      canReview = canCustomerReview(dbUser.createdAt);
      if (!canReview) {
        reviewBlockedMessage = reviewEligibilityMessage(dbUser.createdAt);
      }
    }
  }

  return (
    <div className="space-y-10">
      <BackToCatalogLink />

      <ProductAddToCart
        product={{
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          imagePosition: product.imagePosition,
          listPrice: product.listPrice,
          imageScale: product.imageScale,
          categoryId: product.categoryId,
        }}
        variants={product.variants.map((v) => ({
          id: v.id,
          colorLabel: v.colorLabel,
          imageUrl: v.imageUrl,
          imagePosition: v.imagePosition,
          imageScale: v.imageScale,
          gallery: v.images.map((img) => ({
            imageUrl: img.imageUrl,
            imagePosition: img.imagePosition,
            imageScale: img.imageScale,
          })),
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
        canReview={canReview}
        reviewBlockedMessage={reviewBlockedMessage}
      />
    </div>
  );
}
