/*
  Warnings:

  - A unique constraint covering the columns `[name,isActive]` on the table `Rol` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createdBy` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedBy` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_updatedBy_fkey";

-- DropIndex
DROP INDEX "Rol_name_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "createdBy" SET NOT NULL,
ALTER COLUMN "updatedBy" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Rol_name_isActive_key" ON "Rol"("name", "isActive");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
