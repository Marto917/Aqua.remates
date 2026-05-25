-- Perfil de envío del cliente (autocompletar checkout)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingProvince" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultShippingNotes" TEXT;
