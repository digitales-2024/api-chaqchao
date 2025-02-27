/*
  Warnings:

  - You are about to drop the column `typeClass` on the `ClassSchedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassSchedule" DROP COLUMN "typeClass";

-- DropEnum
DROP TYPE "TypeClass";
