/*
  Warnings:

  - A unique constraint covering the columns `[typeClass,startTime]` on the table `ClassSchedule` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ClassSchedule_startTime_key";

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_typeClass_startTime_key" ON "ClassSchedule"("typeClass", "startTime");
