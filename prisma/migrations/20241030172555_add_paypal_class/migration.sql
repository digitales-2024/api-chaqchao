-- AlterTable
ALTER TABLE "Classes" ADD COLUMN     "paypalAmount" TEXT,
ADD COLUMN     "paypalCurrency" TEXT,
ADD COLUMN     "paypalDate" TEXT,
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "paypalOrderStatus" TEXT;
