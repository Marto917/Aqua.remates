-- Un solo precio de lista por producto; transferencia se calcula con promos del catálogo.
ALTER TABLE "Product" DROP COLUMN IF EXISTS "retailPrice";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "discountRetailPercent";
