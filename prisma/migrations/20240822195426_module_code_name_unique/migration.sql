/*
  Warnings:

  - A unique constraint covering the columns `[cod,name]` on the table `Module` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cod` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Module_name_key";

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "cod" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Module_cod_name_key" ON "Module"("cod", "name");
