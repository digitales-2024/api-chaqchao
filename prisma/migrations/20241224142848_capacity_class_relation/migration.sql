/*
  Warnings:

  - You are about to drop the `CapacityClass` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CapacityClass";

-- CreateTable
CREATE TABLE "ClassCapacity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL',
    "minCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassCapacity_id_key" ON "ClassCapacity"("id");

-- AddForeignKey
ALTER TABLE "ClassCapacity" ADD CONSTRAINT "ClassCapacity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
