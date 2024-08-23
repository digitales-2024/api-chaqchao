/*
  Warnings:

  - You are about to drop the column `isActive` on the `UserRol` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,rolId]` on the table `UserRol` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserRol_userId_rolId_isActive_key";

-- AlterTable
ALTER TABLE "UserRol" DROP COLUMN "isActive";

-- CreateIndex
CREATE UNIQUE INDEX "UserRol_userId_rolId_key" ON "UserRol"("userId", "rolId");
