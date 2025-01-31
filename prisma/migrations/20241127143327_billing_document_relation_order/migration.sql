/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `BillingDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BillingDocument_orderId_key" ON "BillingDocument"("orderId");
