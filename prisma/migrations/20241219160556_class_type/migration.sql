-- CreateEnum
CREATE TYPE "TypeClass" AS ENUM ('CLASSIC', 'PRIVATE', 'CUSTOM');

-- AlterTable
ALTER TABLE "ClassSchedule" ADD COLUMN     "typeClass" "TypeClass" NOT NULL DEFAULT 'CLASSIC';
