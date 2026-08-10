-- AlterTable
ALTER TABLE "RetailOrder" ADD COLUMN "staffSeenAt" TIMESTAMP(3);

-- Pedidos previos: no mostrar NEW; solo los que entren después y nadie abrió.
UPDATE "RetailOrder" SET "staffSeenAt" = "createdAt" WHERE "staffSeenAt" IS NULL;
