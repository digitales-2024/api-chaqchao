-- CreateEnum
CREATE TYPE "TypeClass" AS ENUM ('NORMAL', 'PRIVATE', 'GROUP');

-- AlterTable
ALTER TABLE "Classes" ADD COLUMN     "typeClass" "TypeClass" NOT NULL DEFAULT 'NORMAL';
