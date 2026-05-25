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
