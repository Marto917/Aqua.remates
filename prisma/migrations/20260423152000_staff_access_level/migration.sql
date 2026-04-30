-- CreateEnum
CREATE TYPE "StaffAccessLevel" AS ENUM ('MANAGER', 'SELLER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "staffAccessLevel" "StaffAccessLevel";
