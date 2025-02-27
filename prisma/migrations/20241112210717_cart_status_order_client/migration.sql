/*
  Warnings:

  - The values [ACTIVE] on the enum `CartStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONFIRMED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clientId` on the `Cart` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CartStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "Cart" ALTER COLUMN "cartStatus" TYPE "CartStatus_new" USING ("cartStatus"::text::"CartStatus_new");
ALTER TYPE "CartStatus" RENAME TO "CartStatus_old";
ALTER TYPE "CartStatus_new" RENAME TO "CartStatus";
DROP TYPE "CartStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'READY', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "orderStatus" TYPE "OrderStatus_new" USING ("orderStatus"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "FK_Cart_Client";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "clientId";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "FK_Cart_Client" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
