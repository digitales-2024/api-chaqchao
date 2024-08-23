/*
  Warnings:

  - A unique constraint covering the columns `[moduleId,permissionId,rolId]` on the table `Module_Permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Module_Permissions_moduleId_permissionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Module_Permissions_moduleId_permissionId_rolId_key" ON "Module_Permissions"("moduleId", "permissionId", "rolId");
