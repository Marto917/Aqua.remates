import { formatArs } from "@/lib/currency";
import { getTransferPrice } from "@/lib/store-pricing";

export type ProductPromoFields = {
  listPrice: unknown;
  retailPrice: unknown;
  promoPrice?: unknown | null;
  showPromoBadge?: boolean;
  promoBadgePercent?: number | null;
};

export function getProductPromoDisplay(product: ProductPromoFields) {
  const normalTransfer = getTransferPrice(product);
  const promoRaw = product.promoPrice != null ? Number(product.promoPrice) : null;
  const hasPromoPrice = promoRaw != null && Number.isFinite(promoRaw) && promoRaw > 0;
  const showBadge = Boolean(product.showPromoBadge);
  const badgePercent = product.promoBadgePercent ?? null;

  return {
    normalTransfer,
    promoPrice: hasPromoPrice ? promoRaw! : null,
    showPromoPrice: hasPromoPrice && promoRaw! < normalTransfer - 0.01,
    showBadge,
    badgePercent,
    normalTransferFormatted: formatArs(normalTransfer),
    promoPriceFormatted: hasPromoPrice ? formatArs(promoRaw!) : null,
  };
}
