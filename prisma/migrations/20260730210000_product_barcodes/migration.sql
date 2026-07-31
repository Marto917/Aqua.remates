-- Varios códigos de barra por producto (proveedores / colores / envases).
CREATE TABLE "ProductBarcode" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductBarcode_code_key" ON "ProductBarcode"("code");
CREATE INDEX "ProductBarcode_productId_idx" ON "ProductBarcode"("productId");

ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar SKU existentes como primer código.
INSERT INTO "ProductBarcode" ("id", "productId", "code", "label", "sortOrder", "createdAt")
SELECT
  'mig_' || "id",
  "id",
  TRIM("sku"),
  NULL,
  0,
  CURRENT_TIMESTAMP
FROM "Product"
WHERE "sku" IS NOT NULL AND TRIM("sku") <> '';
