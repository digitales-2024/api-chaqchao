/*
  Warnings:

  - You are about to drop the column `postalCode` on the `BillingDocument` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillingDocument" DROP COLUMN "postalCode",
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "state" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL;
