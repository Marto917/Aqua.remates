import { prisma } from "@/lib/prisma";

export type StoreSettingsData = {
  bankHolder: string;
  bankAlias: string;
  bankCbu: string;
  bankExtraNotes: string | null;
  transferDiscountPercent: number;
  mercadoPagoMarkupPercent: number;
  discountBadgeLabel: string;
};

const DEFAULTS: StoreSettingsData = {
  bankHolder: "Aqua SRL",
  bankAlias: "aqua.tienda",
  bankCbu: "",
  bankExtraNotes: null,
  transferDiscountPercent: 15,
  mercadoPagoMarkupPercent: 10,
  discountBadgeLabel: "descuento transferencia",
};

export async function getStoreSettings(): Promise<StoreSettingsData> {
  try {
    const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    if (!row) {
      return DEFAULTS;
    }
    return {
      bankHolder: row.bankHolder,
      bankAlias: row.bankAlias,
      bankCbu: row.bankCbu,
      bankExtraNotes: row.bankExtraNotes,
      transferDiscountPercent: row.transferDiscountPercent,
      mercadoPagoMarkupPercent: row.mercadoPagoMarkupPercent,
      discountBadgeLabel: row.discountBadgeLabel,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function ensureStoreSettings() {
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...DEFAULTS, bankCbu: "0000003100098765432101" },
  });
}
