-- AlterEnum
ALTER TYPE "MethodPayment" ADD VALUE 'CASH';

-- AlterTable
ALTER TABLE "ClassRegister" ALTER COLUMN "userName" DROP NOT NULL,
ALTER COLUMN "userEmail" DROP NOT NULL,
ALTER COLUMN "userPhone" DROP NOT NULL;
