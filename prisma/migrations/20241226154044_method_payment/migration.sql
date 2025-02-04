-- CreateEnum
CREATE TYPE "MethodPayment" AS ENUM ('PAYPAL', 'IZIPAY');

-- AlterTable
ALTER TABLE "ClassRegister" ADD COLUMN     "methodPayment" "MethodPayment";
