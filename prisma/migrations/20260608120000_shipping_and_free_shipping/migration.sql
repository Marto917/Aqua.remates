ALTER TABLE "RetailOrder" ADD COLUMN "subtotalAmount" DECIMAL(10,2);
ALTER TABLE "RetailOrder" ADD COLUMN "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "RetailOrder" ADD COLUMN "shippingZone" TEXT;

UPDATE "RetailOrder" SET "subtotalAmount" = "totalAmount" WHERE "subtotalAmount" IS NULL;

ALTER TABLE "StoreSettings" ADD COLUMN "freeShippingRules" JSONB;
