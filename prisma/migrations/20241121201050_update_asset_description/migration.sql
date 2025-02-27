/*
  Warnings:

  - You are about to drop the column `typeDescription` on the `Claims` table. All the data in the column will be lost.
  - Added the required column `assetDescription` to the `Claims` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Claims" DROP COLUMN "typeDescription",
ADD COLUMN     "assetDescription" TEXT NOT NULL;
