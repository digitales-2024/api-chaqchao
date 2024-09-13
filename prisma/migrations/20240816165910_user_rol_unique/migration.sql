/*
  Warnings:

  - A unique constraint covering the columns `[userId,rolId,isActive]` on the table `UserRol` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserRol_userId_rolId_isActive_key" ON "UserRol"("userId", "rolId", "isActive");
