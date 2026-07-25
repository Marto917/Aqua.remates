-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerAddress_userId_idx" ON "CustomerAddress"("userId");

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy single default shipping fields into CustomerAddress
INSERT INTO "CustomerAddress" ("id", "userId", "label", "address", "city", "province", "postalCode", "notes", "isDefault", "createdAt", "updatedAt")
SELECT
  concat('migrated_', "id"),
  "id",
  'Principal',
  TRIM("defaultShippingAddress"),
  COALESCE(NULLIF(TRIM("defaultShippingCity"), ''), '—'),
  COALESCE(NULLIF(TRIM("defaultShippingProvince"), ''), '—'),
  COALESCE(NULLIF(TRIM("defaultShippingPostalCode"), ''), '0000'),
  "defaultShippingNotes",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "defaultShippingAddress" IS NOT NULL
  AND TRIM("defaultShippingAddress") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerAddress" ca WHERE ca."userId" = "User"."id"
  );
