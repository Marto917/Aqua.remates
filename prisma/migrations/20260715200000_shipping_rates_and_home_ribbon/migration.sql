-- Tarifas de envío editables + cinta promocional del home
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "shippingRateCaba" INTEGER NOT NULL DEFAULT 6000;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "shippingRatePba" INTEGER NOT NULL DEFAULT 10000;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "shippingRateOutside" INTEGER NOT NULL DEFAULT 20000;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "homeRibbonImageUrl" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "homeRibbonLinkUrl" TEXT;
