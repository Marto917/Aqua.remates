-- Promo badges, wishlist, variant gallery, reviews extended, footer, registration throttle

ALTER TABLE "Product" ADD COLUMN "promoBadgePercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN "promoPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "showPromoBadge" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProductReview" ADD COLUMN "pros" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "cons" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "recommends" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "StoreSettings" ADD COLUMN "footerImageUrl" TEXT;

CREATE TABLE "RegistrationDevice" (
    "id" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "lastRegistrationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegistrationDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegistrationDevice_deviceKey_key" ON "RegistrationDevice"("deviceKey");

CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductVariantImage" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePosition" TEXT DEFAULT '50% 50%',
    "imageScale" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariantImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductVariantImage_variantId_idx" ON "ProductVariantImage"("variantId");

ALTER TABLE "ProductVariantImage" ADD CONSTRAINT "ProductVariantImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
