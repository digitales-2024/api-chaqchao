/*
  Warnings:

  - You are about to drop the column `ruc` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillingDocument" ADD COLUMN     "ruc" TEXT;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "ruc";
