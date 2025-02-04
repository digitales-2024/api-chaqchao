/*
  Warnings:

  - You are about to drop the column `comments` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `paypalAmount` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `paypalCurrency` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `paypalDate` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `paypalOrderId` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `paypalOrderStatus` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalAdults` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalChildren` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalParticipants` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalPriceAdults` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `totalPriceChildren` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `typeCurrency` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `userPhone` on the `Classes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Classes" DROP COLUMN "comments",
DROP COLUMN "paypalAmount",
DROP COLUMN "paypalCurrency",
DROP COLUMN "paypalDate",
DROP COLUMN "paypalOrderId",
DROP COLUMN "paypalOrderStatus",
DROP COLUMN "status",
DROP COLUMN "totalAdults",
DROP COLUMN "totalChildren",
DROP COLUMN "totalParticipants",
DROP COLUMN "totalPrice",
DROP COLUMN "totalPriceAdults",
DROP COLUMN "totalPriceChildren",
DROP COLUMN "typeCurrency",
DROP COLUMN "userEmail",
DROP COLUMN "userName",
DROP COLUMN "userPhone";

-- CreateTable
CREATE TABLE "ClassRegister" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "totalParticipants" INTEGER NOT NULL,
    "totalAdults" INTEGER NOT NULL,
    "totalChildren" INTEGER NOT NULL,
    "totalPriceAdults" DOUBLE PRECISION NOT NULL,
    "totalPriceChildren" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "typeCurrency" "TypeCurrency" NOT NULL,
    "comments" TEXT,
    "status" "ClassStatus" NOT NULL DEFAULT 'PENDING',
    "paypalOrderId" TEXT,
    "paypalOrderStatus" TEXT,
    "paypalAmount" TEXT,
    "paypalCurrency" TEXT,
    "paypalDate" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classesId" TEXT,

    CONSTRAINT "ClassRegister_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegister_id_key" ON "ClassRegister"("id");

-- AddForeignKey
ALTER TABLE "ClassRegister" ADD CONSTRAINT "ClassRegister_classesId_fkey" FOREIGN KEY ("classesId") REFERENCES "Classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
