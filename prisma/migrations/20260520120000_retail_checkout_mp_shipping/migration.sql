-- CreateEnum
CREATE TYPE "RetailPaymentMethod" AS ENUM ('BANK_TRANSFER', 'MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "RetailShippingMethod" AS ENUM ('PICKUP', 'DELIVERY', 'SHIPPING_TO_COORDINATE');

-- AlterEnum
ALTER TYPE "RetailOrderStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "RetailOrderStatus" ADD VALUE 'PAYMENT_APPROVED';

-- AlterTable
ALTER TABLE "RetailOrder" ADD COLUMN "paymentMethod" "RetailPaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER';
ALTER TABLE "RetailOrder" ADD COLUMN "shippingMethod" "RetailShippingMethod" NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "RetailOrder" ADD COLUMN "shippingAddress" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "shippingProvince" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "shippingPostalCode" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "shippingNotes" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "mercadoPagoPreferenceId" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN "mercadoPagoPaymentId" TEXT;
ALTER TABLE "RetailOrder" ALTER COLUMN "transferAlias" DROP NOT NULL;
ALTER TABLE "RetailOrder" ALTER COLUMN "transferCbu" DROP NOT NULL;
