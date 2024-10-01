/*
  Warnings:

  - Added the required column `languageClass` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAdults` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalChildren` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPriceAdults` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPriceChildren` to the `Classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeCurrency` to the `Classes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Classes" ADD COLUMN     "languageClass" TEXT NOT NULL,
ADD COLUMN     "totalAdults" INTEGER NOT NULL,
ADD COLUMN     "totalChildren" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalPriceAdults" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalPriceChildren" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "typeCurrency" TEXT NOT NULL;
