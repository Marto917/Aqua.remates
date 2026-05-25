-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "imageScale" DECIMAL(4,2) NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN "discountBadgeLabel" TEXT;
ALTER TABLE "Product" ALTER COLUMN "discountRetailPercent" SET DEFAULT 15;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "imageScale" DECIMAL(4,2) NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "bankHolder" TEXT NOT NULL DEFAULT 'Aqua SRL',
    "bankAlias" TEXT NOT NULL DEFAULT 'aqua.tienda',
    "bankCbu" TEXT NOT NULL DEFAULT '',
    "bankExtraNotes" TEXT,
    "transferDiscountPercent" INTEGER NOT NULL DEFAULT 15,
    "mercadoPagoMarkupPercent" INTEGER NOT NULL DEFAULT 10,
    "discountBadgeLabel" TEXT NOT NULL DEFAULT 'descuento transferencia',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
