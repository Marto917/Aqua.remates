"use client";

import { DEFAULT_CATALOG_PROMO } from "@/lib/catalog-promo";
import { DEFAULT_FREE_SHIPPING } from "@/lib/free-shipping";
import type { StoreSettingsData } from "@/lib/store-settings";
import React, { createContext, useContext, useEffect, useState } from "react";

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

const StoreSettingsContext = createContext<StoreSettingsData>(DEFAULTS);

export function StoreSettingsProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: StoreSettingsData;
}) {
  const [settings, setSettings] = useState<StoreSettingsData>(initial ?? DEFAULTS);

  useEffect(() => {
    if (initial) return;
    fetch("/api/store-settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => undefined);
  }, [initial]);

  return (
    <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
