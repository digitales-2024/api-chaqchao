/*
  Warnings:

  - You are about to drop the `_CartItemToProductVariation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CartItemToProductVariation" DROP CONSTRAINT "_CartItemToProductVariation_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartItemToProductVariation" DROP CONSTRAINT "_CartItemToProductVariation_B_fkey";

-- DropTable
DROP TABLE "_CartItemToProductVariation";

-- CreateTable
CREATE TABLE "CartItemVariation" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "variationId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CartItemVariation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartItemVariation_id_key" ON "CartItemVariation"("id");

-- AddForeignKey
ALTER TABLE "CartItemVariation" ADD CONSTRAINT "CartItemVariation_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemVariation" ADD CONSTRAINT "CartItemVariation_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "ProductVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
