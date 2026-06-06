import {
  DEFAULT_CATALOG_PROMO,
  type CatalogPromoSettings,
  getCatalogPromoSettings,
} from "@/lib/catalog-promo";
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
  catalogPromoCategoryIds: [] as string[],
};

export async function getStoreSettings(): Promise<StoreSettingsData> {
  try {
    const [row, catalogPromo] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: "default" } }),
      getCatalogPromoSettings(),
    ]);
    if (!row) {
      return { ...DEFAULTS, catalogPromo };
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
