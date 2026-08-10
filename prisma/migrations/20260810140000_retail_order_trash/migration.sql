-- Soft-delete / papelera de pedidos minoristas
ALTER TABLE "RetailOrder" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "RetailOrder" ADD COLUMN "deletedById" TEXT;

CREATE INDEX "RetailOrder_deletedAt_idx" ON "RetailOrder"("deletedAt");
