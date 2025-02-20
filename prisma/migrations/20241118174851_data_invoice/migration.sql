/*
  Warnings:

  - You are about to drop the column `ruc` on the `BillingDocument` table. All the data in the column will be lost.
  - Added the required column `address` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeDocument` to the `BillingDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerLastName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillingDocument" DROP COLUMN "ruc",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "typeDocument" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "lastName" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerLastName" TEXT NOT NULL;
