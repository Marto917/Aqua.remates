-- Comprobante de transferencia en pedidos minoristas
ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "transferProofUrl" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "transferProofUploadedAt" TIMESTAMP(3);
