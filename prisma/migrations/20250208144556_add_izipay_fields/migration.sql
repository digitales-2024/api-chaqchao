-- AlterTable
ALTER TABLE "ClassRegister" ADD COLUMN     "izipayAuthCode" TEXT,
ADD COLUMN     "izipayCardBrand" TEXT,
ADD COLUMN     "izipayLastFourDigits" TEXT,
ADD COLUMN     "izipayTransactionId" TEXT;
