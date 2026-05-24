-- CreateEnum
CREATE TYPE "DeliveryDispatchStatus" AS ENUM ('PENDING', 'DISPATCHED', 'DELIVERED');

-- AlterTable
ALTER TABLE "RetailOrder" ADD COLUMN "deliveryStatus" "DeliveryDispatchStatus";
ALTER TABLE "RetailOrder" ADD COLUMN "deliveryCode" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "deliveryDispatchedAt" TIMESTAMP(3);
ALTER TABLE "RetailOrder" ADD COLUMN "deliveryDeliveredAt" TIMESTAMP(3);

ALTER TABLE "WholesaleRequest" ADD COLUMN "deliveryStatus" "DeliveryDispatchStatus";
ALTER TABLE "WholesaleRequest" ADD COLUMN "deliveryCode" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "deliveryDispatchedAt" TIMESTAMP(3);
ALTER TABLE "WholesaleRequest" ADD COLUMN "deliveryDeliveredAt" TIMESTAMP(3);

UPDATE "RetailOrder" SET "deliveryStatus" = 'PENDING' WHERE "shippingMethod" = 'DELIVERY' AND "deliveryStatus" IS NULL;
UPDATE "WholesaleRequest" SET "deliveryStatus" = 'PENDING' WHERE "shippingMethod" = 'DELIVERY' AND "deliveryStatus" IS NULL;
