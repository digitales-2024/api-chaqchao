/*
  Warnings:

  - You are about to drop the column `izipayAuthCode` on the `ClassRegister` table. All the data in the column will be lost.
  - You are about to drop the column `izipayCardBrand` on the `ClassRegister` table. All the data in the column will be lost.
  - You are about to drop the column `izipayLastFourDigits` on the `ClassRegister` table. All the data in the column will be lost.
  - You are about to drop the column `izipayTransactionId` on the `ClassRegister` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassRegister" DROP COLUMN "izipayAuthCode",
DROP COLUMN "izipayCardBrand",
DROP COLUMN "izipayLastFourDigits",
DROP COLUMN "izipayTransactionId",
ADD COLUMN     "izipayAmount" TEXT,
ADD COLUMN     "izipayCurrency" TEXT,
ADD COLUMN     "izipayDate" TEXT,
ADD COLUMN     "izipayOrderId" TEXT,
ADD COLUMN     "izipayOrderStatus" TEXT;
