-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "ruc" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "someonePickup" BOOLEAN DEFAULT false;

ALTER TABLE "Order" ADD COLUMN     "isShipping" BOOLEAN DEFAULT false;