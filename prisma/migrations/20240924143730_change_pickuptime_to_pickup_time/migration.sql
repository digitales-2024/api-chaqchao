/*
  Warnings:

  - You are about to drop the column `pickuptime` on the `Order` table. All the data in the column will be lost.
  - Added the required column `pickupTime` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "pickuptime",
ADD COLUMN     "pickupTime" TIMESTAMP(3) NOT NULL;
