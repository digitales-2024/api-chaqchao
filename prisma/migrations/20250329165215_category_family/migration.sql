/*
  Warnings:

  - The `family` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "family",
ADD COLUMN     "family" TEXT NOT NULL DEFAULT 'OTHER';

-- DropEnum
DROP TYPE "Family";
