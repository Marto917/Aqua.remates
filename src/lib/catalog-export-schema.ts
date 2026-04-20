/** Formato del archivo `catalog-aqua.json` dentro del ZIP de exportación. */

export const CATALOG_EXPORT_VERSION = 1 as const;

export type CatalogExportV1 = {
  version: typeof CATALOG_EXPORT_VERSION;
  exportedAt: string;
  categories: { name: string; slug: string }[];
  products: {
    slug: string;
    name: string;
    description: string;
    imageUrl: string;
    listPrice: string;
    retailPrice: string;
    wholesalePrice: string;
    discountRetailPercent: number;
    discountWholesalePercent: number;
    isActive: boolean;
    isBestSeller: boolean;
    categorySlug: string;
    variants: {
      colorLabel: string;
      imageUrl: string | null;
      sortOrder: number;
      isActive: boolean;
    }[];
  }[];
};
