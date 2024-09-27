import { PrismaClient } from '@prisma/client';
import { modulesSeed } from './modules/seeds/data/modules.seed';
import { permissionsSeed } from './modules/seeds/data/permissions.seed';
import { rolSuperAdminSeed, superAdminSeed } from './modules/seeds/data/superadmin.seed';
import { handleException } from './utils';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\x1b[32m Iniciando proceso de seed... \x1b[0m');

    // Obtener todos los módulos y permisos actuales de la base de datos
    const existingModules = await prisma.module.findMany();
    const existingPermissions = await prisma.permission.findMany();

    // check icon in the terminal for the following console.log
    console.log('\x1b[32m ✓ \x1b[0m Módulos y permisos actuales obtenidos');

    // Filtrar módulos que ya existen para solo agregar los nuevos
    const newModules = modulesSeed.filter(
      (module) => !existingModules.some((existingModule) => existingModule.cod === module.cod)
    );

    // Si hay nuevos módulos, insertarlos
    if (newModules.length > 0) {
      await prisma.module.createMany({
        data: newModules,
        skipDuplicates: true
      });
      console.log('\x1b[32m Nuevos módulos insertados \x1b[0m');
    }

    // Filtrar permisos que ya existen para solo agregar los nuevos
    const newPermissions = permissionsSeed.filter(
      (permission) =>
        !existingPermissions.some((existingPermission) => existingPermission.cod === permission.cod)
    );

    // Si hay nuevos permisos, insertarlos
    if (newPermissions.length > 0) {
      await prisma.permission.createMany({
        data: newPermissions,
        skipDuplicates: true
      });
      console.log('\x1b[32m Nuevos permisos insertados \x1b[0m');
    }

    // Obtener la lista actualizada de módulos y permisos
    const updatedModulesList = await prisma.module.findMany();
    const updatedPermissionsList = await prisma.permission.findMany();

    console.log('\x1b[32m ✓ \x1b[0m Lista de módulos y permisos actualizada');

    // Crear o actualizar las relaciones entre módulos y permisos
    const modulePermissions = [];

    const specificPermissionsMap = new Map<string, string[]>(); // key: moduleId, value: permissionIds
    const generalPermissions = [];

    updatedPermissionsList.forEach((permission) => {
      const isSpecificPermission = updatedModulesList.some((module) =>
        permission.cod.includes(module.cod)
      );

      if (isSpecificPermission) {
        updatedModulesList.forEach((module) => {
          if (permission.cod.includes(module.cod)) {
            if (!specificPermissionsMap.has(module.id)) {
              specificPermissionsMap.set(module.id, []);
            }
            specificPermissionsMap.get(module.id).push(permission.id);
          }
        });
      } else {
        generalPermissions.push(permission.id);
      }
    });

    // Asignar permisos generales a todos los módulos
    updatedModulesList.forEach((module) => {
      generalPermissions.forEach((permissionId) => {
        modulePermissions.push({
          moduleId: module.id,
          permissionId: permissionId
        });
      });
    });

    // Asignar permisos específicos a módulos específicos
    specificPermissionsMap.forEach((permissionIds, moduleId) => {
      permissionIds.forEach((permissionId) => {
        modulePermissions.push({
          moduleId: moduleId,
          permissionId: permissionId
        });
      });
    });

    // Crear o actualizar las relaciones entre módulos y permisos
    if (modulePermissions.length > 0) {
      await prisma.modulePermissions.createMany({
        data: modulePermissions,
        skipDuplicates: true
      });
      console.log('\x1b[32m ✓ \x1b[0m Relaciones entre módulos y permisos actualizadas');
    }

    // Crear rol superadmin si no existe
    const superadminRole = await prisma.rol.upsert({
      where: { name_isActive: { name: rolSuperAdminSeed.name, isActive: true } },
      update: {},
      create: rolSuperAdminSeed
    });
    console.log('\x1b[32m Rol superadmin creado o actualizado \x1b[0m');

    // Asignar permisos del módulo al rol superadmin
    const allModulePermissions = await prisma.modulePermissions.findMany();
    const rolModulePermissionEntries = allModulePermissions.map((modulePermission) => ({
      rolId: superadminRole.id,
      modulePermissionsId: modulePermission.id
    }));

    await prisma.rolModulePermissions.createMany({
      data: rolModulePermissionEntries,
      skipDuplicates: true
    });
    console.log('\x1b[32m ✓ \x1b[0m Permisos asignados al rol superadmin');

    // Crear usuario superadmin y asignarle el rol si no existe
    await prisma.user.upsert({
      where: { email_isActive: { email: superAdminSeed.email, isActive: true } },
      update: {},
      create: {
        ...superAdminSeed,
        password: await bcrypt.hash(superAdminSeed.password, 10),
        isSuperAdmin: true,
        userRols: {
          create: {
            rolId: superadminRole.id
          }
        }
      }
    });
    console.log('\x1b[32m Usuario superadmin creado o actualizado con éxito \x1b[0m');
  } catch (error) {
    handleException(error, '\x1b[31m ✗ Error generating or updating super admin \x1b[0m');
  }
}

main()
  .catch((error) => {
    console.error(`\x1b[31m ${error} \x1b[0m`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
