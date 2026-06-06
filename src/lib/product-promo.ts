import { formatArs } from "@/lib/currency";
import {
  type CatalogPromoSettings,
  DEFAULT_CATALOG_PROMO,
  getProductCatalogPromoPercent,
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
  const percent = getProductCatalogPromoPercent(product.categoryId, catalogPromo);

  const promoPrice =
    percent != null
      ? Math.round(normalTransfer * (1 - percent / 100) * 100) / 100
      : null;

  const showPromoPrice = promoPrice != null && promoPrice < normalTransfer - 0.01;
  const showBadge = percent != null;
  const badgePercent = percent;

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
