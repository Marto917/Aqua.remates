-- AlterEnum
ALTER TYPE "WholesaleRequestStatus" ADD VALUE 'PENDIENTE_CONFIRMACION';
ALTER TYPE "WholesaleRequestStatus" ADD VALUE 'CONFIRMADO';
ALTER TYPE "WholesaleRequestStatus" ADD VALUE 'RECHAZADO';

-- AlterTable
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingMethod" "RetailShippingMethod" NOT NULL DEFAULT 'SHIPPING_TO_COORDINATE';
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingAddress" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingProvince" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingPostalCode" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "shippingNotes" TEXT;
ALTER TABLE "WholesaleRequest" ADD COLUMN "vendorNote" TEXT;
