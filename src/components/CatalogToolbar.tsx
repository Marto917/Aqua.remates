import { prisma } from "@/lib/prisma";
import { formatDisplayWords } from "@/lib/display-text";
import { CatalogToolbarClient } from "@/components/CatalogToolbarClient";

type CatalogToolbarProps = {
  selectedCategory?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
};

export async function CatalogToolbar({
  selectedCategory,
  search,
  minPrice,
  maxPrice,
}: CatalogToolbarProps) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <CatalogToolbarClient
      categories={categories.map((c) => ({ slug: c.slug, name: formatDisplayWords(c.name) }))}
      selectedCategory={selectedCategory}
      search={search}
      minPrice={minPrice}
      maxPrice={maxPrice}
    />
  );
}
