-- CreateEnum
CREATE TYPE "PromoCodeRewardType" AS ENUM ('PERCENT', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromoCodeScopeType" AS ENUM ('ALL', 'CATEGORIES', 'PRODUCTS');

-- AlterTable
ALTER TABLE "RetailOrder" ADD COLUMN "promoCode" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "promoDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "rewardType" "PromoCodeRewardType" NOT NULL,
    "rewardValue" DECIMAL(10,2) NOT NULL,
    "scopeType" "PromoCodeScopeType" NOT NULL DEFAULT 'ALL',
    "categoryIds" JSONB,
    "productIds" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
