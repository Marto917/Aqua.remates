import { formatArs } from "@/lib/currency";
import {
  type CatalogPromoSettings,
  DEFAULT_CATALOG_PROMO,
  isProductInCatalogPromo,
} from "@/lib/catalog-promo";
import { getTransferPrice } from "@/lib/store-pricing";

export type ProductPromoFields = {
  listPrice: unknown;
  retailPrice: unknown;
  categoryId?: string | null;
};

export function getProductPromoDisplay(
  product: ProductPromoFields,
  catalogPromo: CatalogPromoSettings = DEFAULT_CATALOG_PROMO,
) {
  const normalTransfer = getTransferPrice(product);
  const applies = isProductInCatalogPromo(product.categoryId, catalogPromo);

  const discountPercent = catalogPromo.discountPercent ?? 0;
  const promoPrice =
    applies && discountPercent > 0
      ? Math.round(normalTransfer * (1 - discountPercent / 100) * 100) / 100
      : null;

  const showPromoPrice = promoPrice != null && promoPrice < normalTransfer - 0.01;
  const showBadge = applies && Boolean(catalogPromo.badgePercent);
  const badgePercent = catalogPromo.badgePercent ?? null;

  return {
    normalTransfer,
    promoPrice,
    showPromoPrice,
    showBadge,
    badgePercent,
    normalTransferFormatted: formatArs(normalTransfer),
    promoPriceFormatted: promoPrice != null ? formatArs(promoPrice) : null,
  };
}
