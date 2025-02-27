-- CreateEnum
CREATE TYPE "TypeProduct" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "TypeClaim" AS ENUM ('CLAIM', 'COMPLAINT');

-- CreateTable
CREATE TABLE "Claims" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "parent" TEXT,
    "typeProduct" "TypeProduct" NOT NULL,
    "amountClaimed" TEXT NOT NULL,
    "typeDescription" TEXT NOT NULL,
    "typeClaim" "TypeClaim" NOT NULL,
    "detail" TEXT NOT NULL,
    "dateClaim" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Claims_id_key" ON "Claims"("id");
