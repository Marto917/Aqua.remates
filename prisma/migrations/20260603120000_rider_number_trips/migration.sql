-- Número de repartidor y asignación de viajes a pedidos minoristas
ALTER TABLE "Rider" ADD COLUMN IF NOT EXISTS "riderNumber" INTEGER;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn FROM "Rider"
)
UPDATE "Rider" r
SET "riderNumber" = numbered.rn
FROM numbered
WHERE r.id = numbered.id AND r."riderNumber" IS NULL;

ALTER TABLE "Rider" ALTER COLUMN "riderNumber" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Rider_riderNumber_key" ON "Rider"("riderNumber");

ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "assignedRiderId" TEXT;
ALTER TABLE "RetailOrder" ADD COLUMN IF NOT EXISTS "riderAssignedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RetailOrder_assignedRiderId_fkey'
  ) THEN
    ALTER TABLE "RetailOrder"
      ADD CONSTRAINT "RetailOrder_assignedRiderId_fkey"
      FOREIGN KEY ("assignedRiderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "RetailOrder_assignedRiderId_idx" ON "RetailOrder"("assignedRiderId");
