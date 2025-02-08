/*
  Warnings:

  - The values [SOL,DOLAR] on the enum `TypeCurrency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TypeCurrency_new" AS ENUM ('PEN', 'USD');
ALTER TABLE "ClassPriceConfig" ALTER COLUMN "typeCurrency" TYPE "TypeCurrency_new" USING ("typeCurrency"::text::"TypeCurrency_new");
ALTER TABLE "ClassRegister" ALTER COLUMN "typeCurrency" TYPE "TypeCurrency_new" USING ("typeCurrency"::text::"TypeCurrency_new");
ALTER TYPE "TypeCurrency" RENAME TO "TypeCurrency_old";
ALTER TYPE "TypeCurrency_new" RENAME TO "TypeCurrency";
DROP TYPE "TypeCurrency_old";
COMMIT;
