-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_clientId_fkey";

-- DropIndex
DROP INDEX "Cart_cartStatus_idx";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "orderId" TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
