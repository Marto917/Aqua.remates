ALTER TABLE "StoreSettings" ADD COLUMN "catalogPromoEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreSettings" ADD COLUMN "catalogPromoBadgePercent" INTEGER;
ALTER TABLE "StoreSettings" ADD COLUMN "catalogPromoDiscountPercent" INTEGER;
ALTER TABLE "StoreSettings" ADD COLUMN "catalogPromoCategoryIds" JSONB;
