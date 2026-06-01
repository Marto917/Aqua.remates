-- Pegar y ejecutar en Neon → SQL Editor (una sola vez).
-- Corrige errores al aprobar transferencias y al guardar perfil de envío.

ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "transferProofUrl" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "transferProofUploadedAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingProvince" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingNotes" TEXT;

-- Hero promocional (home)
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoDesktopImageUrl" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoMobileImageUrl" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "heroPromoLinkUrl" TEXT;

-- Armado de pedidos (envíos)
ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "packedAt" TIMESTAMP(3);
