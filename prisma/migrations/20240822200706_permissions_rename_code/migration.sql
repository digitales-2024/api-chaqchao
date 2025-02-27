/*
  Warnings:

  - You are about to drop the column `code` on the `Permission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cod,name]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cod` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Permission_code_name_key";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "code",
ADD COLUMN     "cod" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Permission_cod_name_key" ON "Permission"("cod", "name");
