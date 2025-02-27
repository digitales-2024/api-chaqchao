/*
  Warnings:

  - You are about to drop the `Module_Permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Module_Permissions" DROP CONSTRAINT "Module_Permissions_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "Module_Permissions" DROP CONSTRAINT "Module_Permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "Module_Permissions" DROP CONSTRAINT "Module_Permissions_rolId_fkey";

-- DropTable
DROP TABLE "Module_Permissions";

-- CreateTable
CREATE TABLE "ModulePermissions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleModulePermissions" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "modulePermissionsId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermissions_id_key" ON "ModulePermissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermissions_moduleId_permissionId_key" ON "ModulePermissions"("moduleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleModulePermissions_id_key" ON "RoleModulePermissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoleModulePermissions_rolId_modulePermissionsId_key" ON "RoleModulePermissions"("rolId", "modulePermissionsId");

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleModulePermissions" ADD CONSTRAINT "RoleModulePermissions_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleModulePermissions" ADD CONSTRAINT "RoleModulePermissions_modulePermissionsId_fkey" FOREIGN KEY ("modulePermissionsId") REFERENCES "ModulePermissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
