/*
  Warnings:

  - You are about to drop the `RoleModulePermissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleModulePermissions" DROP CONSTRAINT "RoleModulePermissions_modulePermissionsId_fkey";

-- DropForeignKey
ALTER TABLE "RoleModulePermissions" DROP CONSTRAINT "RoleModulePermissions_rolId_fkey";

-- DropTable
DROP TABLE "RoleModulePermissions";

-- CreateTable
CREATE TABLE "RolModulePermissions" (
    "id" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "modulePermissionsId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolModulePermissions_id_key" ON "RolModulePermissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RolModulePermissions_rolId_modulePermissionsId_key" ON "RolModulePermissions"("rolId", "modulePermissionsId");

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_modulePermissionsId_fkey" FOREIGN KEY ("modulePermissionsId") REFERENCES "ModulePermissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
