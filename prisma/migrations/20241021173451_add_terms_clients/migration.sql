/*
  Warnings:

  - You are about to drop the column `term` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "term",
ADD COLUMN     "terms" BOOLEAN NOT NULL DEFAULT true;
