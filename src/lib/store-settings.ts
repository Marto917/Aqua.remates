import {
  DEFAULT_CATALOG_PROMO,
  type CatalogPromoSettings,
  getCatalogPromoSettings,
} from "@/lib/catalog-promo";
import {
  DEFAULT_FREE_SHIPPING,
  type FreeShippingSettings,
  getFreeShippingSettings,
} from "@/lib/free-shipping";
import { prisma } from "@/lib/prisma";

export type StoreSettingsData = {
  bankHolder: string;
  bankAlias: string;
  bankCbu: string;
  bankExtraNotes: string | null;
  transferDiscountPercent: number;
  mercadoPagoMarkupPercent: number;
  discountBadgeLabel: string;
  themeBrandPrimary: string | null;
  themeBrandDark: string | null;
  themeBrandMuted: string | null;
  footerImageUrl: string | null;
  catalogPromo: CatalogPromoSettings;
  freeShipping: FreeShippingSettings;
  ridersAppEnabled: boolean;
  brandLogoUrl: string | null;
  storePhone: string | null;
  storeInstagram: string | null;
  storeTiktok: string | null;
  storeAddress: string | null;
};

const DEFAULTS: StoreSettingsData = {
  bankHolder: "Aqua SRL",
  bankAlias: "aqua.tienda",
  bankCbu: "",
  bankExtraNotes: null,
  transferDiscountPercent: 15,
  mercadoPagoMarkupPercent: 10,
  discountBadgeLabel: "descuento transferencia",
  themeBrandPrimary: null,
  themeBrandDark: null,
  themeBrandMuted: null,
  footerImageUrl: null,
  catalogPromo: DEFAULT_CATALOG_PROMO,
  freeShipping: DEFAULT_FREE_SHIPPING,
  ridersAppEnabled: false,
  brandLogoUrl: null,
  storePhone: null,
  storeInstagram: null,
  storeTiktok: null,
  storeAddress: null,
};

/** Valores para crear la fila única en Prisma (sin objetos anidados). */
const STORE_SETTINGS_CREATE = {
  bankHolder: DEFAULTS.bankHolder,
  bankAlias: DEFAULTS.bankAlias,
  bankCbu: "0000003100098765432101",
  bankExtraNotes: DEFAULTS.bankExtraNotes,
  transferDiscountPercent: DEFAULTS.transferDiscountPercent,
  mercadoPagoMarkupPercent: DEFAULTS.mercadoPagoMarkupPercent,
  discountBadgeLabel: DEFAULTS.discountBadgeLabel,
  themeBrandPrimary: DEFAULTS.themeBrandPrimary,
  themeBrandDark: DEFAULTS.themeBrandDark,
  themeBrandMuted: DEFAULTS.themeBrandMuted,
  footerImageUrl: DEFAULTS.footerImageUrl,
  catalogPromoEnabled: false,
  catalogPromoBadgePercent: null,
  catalogPromoDiscountPercent: null,
};

export async function getStoreSettings(): Promise<StoreSettingsData> {
  try {
    const [row, catalogPromo, freeShipping] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: "default" } }),
      getCatalogPromoSettings(),
      getFreeShippingSettings(),
    ]);
    if (!row) {
      return { ...DEFAULTS, catalogPromo, freeShipping };
    }
    return {
      bankHolder: row.bankHolder,
      bankAlias: row.bankAlias,
      bankCbu: row.bankCbu,
      bankExtraNotes: row.bankExtraNotes,
      transferDiscountPercent: row.transferDiscountPercent,
      mercadoPagoMarkupPercent: row.mercadoPagoMarkupPercent,
      discountBadgeLabel: row.discountBadgeLabel,
      themeBrandPrimary: row.themeBrandPrimary,
      themeBrandDark: row.themeBrandDark,
      themeBrandMuted: row.themeBrandMuted,
      footerImageUrl: row.footerImageUrl,
      catalogPromo,
      freeShipping,
      ridersAppEnabled: row.ridersAppEnabled,
      brandLogoUrl: row.brandLogoUrl,
      storePhone: row.storePhone,
      storeInstagram: row.storeInstagram,
      storeTiktok: row.storeTiktok,
      storeAddress: row.storeAddress,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function ensureStoreSettings() {
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...STORE_SETTINGS_CREATE },
  });
}
