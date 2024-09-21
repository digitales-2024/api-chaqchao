/*
  Warnings:

  - A unique constraint covering the columns `[startTime]` on the table `ClassSchedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_startTime_key" ON "ClassSchedule"("startTime");
