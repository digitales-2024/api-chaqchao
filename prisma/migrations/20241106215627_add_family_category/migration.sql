-- CreateEnum
CREATE TYPE "Family" AS ENUM ('CHOCOLAT', 'DRINK', 'SPICES', 'PERSONAL_CARE', 'MERCH', 'OTHER');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "family" "Family" NOT NULL DEFAULT 'CHOCOLAT';
