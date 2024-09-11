-- DropForeignKey
ALTER TABLE "ModulePermissions" DROP CONSTRAINT "ModulePermissions_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "ModulePermissions" DROP CONSTRAINT "ModulePermissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolModulePermissions" DROP CONSTRAINT "RolModulePermissions_modulePermissionsId_fkey";

-- DropForeignKey
ALTER TABLE "RolModulePermissions" DROP CONSTRAINT "RolModulePermissions_rolId_fkey";

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermissions" ADD CONSTRAINT "ModulePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolModulePermissions" ADD CONSTRAINT "RolModulePermissions_modulePermissionsId_fkey" FOREIGN KEY ("modulePermissionsId") REFERENCES "ModulePermissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
