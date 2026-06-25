import { formatArs } from "@/lib/currency";
import {
  type CatalogPromoSettings,
  DEFAULT_CATALOG_PROMO,
  getProductCatalogPromoPercent,
} from "@/lib/catalog-promo";
import { getListPrice, getTransferPrice } from "@/lib/store-pricing";

export type ProductPromoFields = {
  listPrice: unknown;
  categoryId?: string | null;
};

export function getProductPromoDisplay(
  product: ProductPromoFields,
  catalogPromo: CatalogPromoSettings = DEFAULT_CATALOG_PROMO,
) {
  const listAmount = getListPrice(product);
  const transferAmount = getTransferPrice(product, catalogPromo);
  const percent = getProductCatalogPromoPercent(product.categoryId, catalogPromo);

  const showPromoPrice = percent != null && transferAmount < listAmount - 0.01;
  const showBadge = percent != null;

  return {
    listAmount,
    transferAmount,
    normalTransfer: transferAmount,
    promoPrice: showPromoPrice ? transferAmount : null,
    showPromoPrice,
    showBadge,
    badgePercent: percent,
    listFormatted: formatArs(listAmount),
    normalTransferFormatted: formatArs(transferAmount),
    promoPriceFormatted: showPromoPrice ? formatArs(transferAmount) : null,
  };
}
