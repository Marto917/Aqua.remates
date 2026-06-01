-- Imagen promocional del hero del home (desktop y mobile)
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoDesktopImageUrl" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoMobileImageUrl" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoLinkUrl" TEXT;
