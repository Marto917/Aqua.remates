-- Visibilidad en catálogo, tema de colores, actividad de usuarios
CREATE TYPE "CatalogVisibility" AS ENUM ('PUBLIC_BOTH', 'WHOLESALE_ONLY', 'HIDDEN');

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "catalogVisibility" "CatalogVisibility" NOT NULL DEFAULT 'PUBLIC_BOTH';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "themeBrandPrimary" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "themeBrandDark" TEXT;
ALTER TABLE "StoreSettings" ADD COLUMN IF NOT EXISTS "themeBrandMuted" TEXT;
