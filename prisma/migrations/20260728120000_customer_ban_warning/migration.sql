-- AlterTable
ALTER TABLE "User" ADD COLUMN "bannedUntil" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT,
ADD COLUMN "transferProofRejectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "accountWarning" BOOLEAN NOT NULL DEFAULT false;
