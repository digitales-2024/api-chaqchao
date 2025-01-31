/*
  Warnings:

  - You are about to drop the column `detail` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `parent` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `typeProduct` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `userAddress` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Claims` table. All the data in the column will be lost.
  - You are about to drop the column `userPhone` on the `Claims` table. All the data in the column will be lost.
  - Added the required column `claimDescription` to the `Claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimantEmail` to the `Claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimantName` to the `Claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimantPhone` to the `Claims` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeAsset` to the `Claims` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeAsset" AS ENUM ('PRODUCT', 'SERVICE');

-- AlterTable
ALTER TABLE "Claims" DROP COLUMN "detail",
DROP COLUMN "parent",
DROP COLUMN "typeProduct",
DROP COLUMN "userAddress",
DROP COLUMN "userEmail",
DROP COLUMN "userName",
DROP COLUMN "userPhone",
ADD COLUMN     "claimDescription" TEXT NOT NULL,
ADD COLUMN     "claimantAddress" TEXT,
ADD COLUMN     "claimantEmail" TEXT NOT NULL,
ADD COLUMN     "claimantName" TEXT NOT NULL,
ADD COLUMN     "claimantPhone" TEXT NOT NULL,
ADD COLUMN     "claimantRepresentative" TEXT,
ADD COLUMN     "typeAsset" "TypeAsset" NOT NULL;

-- DropEnum
DROP TYPE "TypeProduct";
