/*
  Warnings:

  - You are about to drop the column `claimType` on the `Claims` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Claims" DROP COLUMN "claimType";

-- DropEnum
DROP TYPE "ClaimType";
