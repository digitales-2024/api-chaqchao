/*
  Warnings:

  - You are about to drop the column `typeAsset` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `typeClaim` on the `Claims` table. All the data in the column will be lost.
  - Added the required column `assetType` to the `Claims` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('CLAIM', 'COMPLAINT');

-- AlterTable
ALTER TABLE "Claims" DROP COLUMN "typeAsset",
DROP COLUMN "typeClaim",
ADD COLUMN     "assetType" "AssetType" NOT NULL,
ADD COLUMN     "claimType" "ClaimType",
ALTER COLUMN "dateClaim" DROP DEFAULT,
ALTER COLUMN "dateClaim" SET DATA TYPE TIMESTAMP(3);

-- DropEnum
DROP TYPE "TypeAsset";

-- DropEnum
DROP TYPE "TypeClaim";
