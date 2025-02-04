/*
  Warnings:

  - A unique constraint covering the columns `[tempId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "tempId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_tempId_key" ON "Cart"("tempId");
