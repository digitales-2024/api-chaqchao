/*
  Warnings:

  - Changed the type of `typeCurrency` on the `Classes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Classes" DROP COLUMN "typeCurrency",
ADD COLUMN     "typeCurrency" "TypeCurrency" NOT NULL;
