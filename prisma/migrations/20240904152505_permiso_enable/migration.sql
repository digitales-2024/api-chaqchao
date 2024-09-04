/*
  Warnings:

  - You are about to drop the column `enabled` on the `Permission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "enabled",
ADD COLUMN     "enable" BOOLEAN NOT NULL DEFAULT false;
