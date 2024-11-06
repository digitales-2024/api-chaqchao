/*
  Warnings:

  - Added the required column `status` to the `Classes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Classes" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "status" "ClassStatus" NOT NULL;
