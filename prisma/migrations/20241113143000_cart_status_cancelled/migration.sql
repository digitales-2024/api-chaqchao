/*
  Warnings:

  - The values [CANCELLED] on the enum `CartStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CartStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "Cart" ALTER COLUMN "cartStatus" DROP DEFAULT;
ALTER TABLE "Cart" ALTER COLUMN "cartStatus" TYPE "CartStatus_new" USING ("cartStatus"::text::"CartStatus_new");
ALTER TYPE "CartStatus" RENAME TO "CartStatus_old";
ALTER TYPE "CartStatus_new" RENAME TO "CartStatus";
DROP TYPE "CartStatus_old";
ALTER TABLE "Cart" ALTER COLUMN "cartStatus" SET DEFAULT 'PENDING';
COMMIT;
