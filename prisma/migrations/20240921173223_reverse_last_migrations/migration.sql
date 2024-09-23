/*
  Warnings:

  - You are about to drop the `CartItemVariation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CartItemVariation" DROP CONSTRAINT "CartItemVariation_cartItemId_fkey";

-- DropForeignKey
ALTER TABLE "CartItemVariation" DROP CONSTRAINT "CartItemVariation_variationId_fkey";

-- DropTable
DROP TABLE "CartItemVariation";
