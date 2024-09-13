import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { rolSuperAdminSeed, superAdminSeed } from './data/superadmin.seed';
import { handleException } from 'src/utils';
import * as bcrypt from 'bcrypt';
import { HttpResponse, UserData } from 'src/interfaces';
import { modulesSeed } from './data/modules.seed';
import { permissionsSeed } from './data/permissions.seed';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generar el usuario super admin con su rol
   * @returns Super admin creado
   */
  async generateInit(): Promise<HttpResponse<UserData>> {
    try {
      // Verificar si los módulos ya están creados
      const existingModules = await this.prisma.module.findMany();
      if (existingModules.length > 0) {
        throw new ConflictException('Database already seeded');
      }

      // Iniciar una transacción
      const result = await this.prisma.$transaction(async (prisma) => {
        // Crear módulos
        await prisma.module.createMany({
          data: modulesSeed,
          skipDuplicates: true
        });

        // Crear permisos
        await prisma.permission.createMany({
          data: permissionsSeed,
          skipDuplicates: true
        });

        // Obtener módulos y permisos creados para usarlos en relaciones
        const modulesList = await prisma.module.findMany();
        const permissionsList = await prisma.permission.findMany();

        // Crear rol superadmin
        const superadminRole = await prisma.rol.create({
          data: rolSuperAdminSeed
        });

        // Preparar las asignaciones de permisos a módulos
        const modulePermissions = [];

        // Dividir permisos en específicos y generales
        const specificPermissionsMap = new Map<string, string[]>(); // key: moduleId, value: permissionIds
        const generalPermissions = [];

        permissionsList.forEach((permission) => {
          const isSpecificPermission = modulesList.some((module) =>
            permission.cod.includes(module.cod)
          );

          if (isSpecificPermission) {
            // Permisos específicos
            modulesList.forEach((module) => {
              if (permission.cod.includes(module.cod)) {
                if (!specificPermissionsMap.has(module.id)) {
                  specificPermissionsMap.set(module.id, []);
                }
                specificPermissionsMap.get(module.id).push(permission.id);
              }
            });
          } else {
            // Permisos generales
            generalPermissions.push(permission.id);
          }
        });

        // Asignar permisos generales a todos los módulos
        modulesList.forEach((module) => {
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

        // Crear relaciones entre módulos y permisos
        const createdModulePermissions = await prisma.modulePermissions.createManyAndReturn({
          data: modulePermissions,
          skipDuplicates: true
        });

        // Asignar permisos del módulo al rol superadmin
        const rolModulePermissionEntries = createdModulePermissions.map((modulePermission) => ({
          rolId: superadminRole.id,
          modulePermissionsId: modulePermission.id
        }));

        await prisma.rolModulePermissions.createMany({
          data: rolModulePermissionEntries,
          skipDuplicates: true
        });

        // Crear usuario superadmin y asignarle el rol
        const superadminUser = await prisma.user.create({
          data: {
            ...superAdminSeed,
            password: await bcrypt.hash(superAdminSeed.password, 10),
            userRols: {
              create: {
                rolId: superadminRole.id
              }
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        return {
          message: 'Super admin created successfully',
          statusCode: HttpStatus.CREATED,
          data: {
            id: superadminUser.id,
            name: superadminUser.name,
            email: superadminUser.email,
            phone: superadminUser.phone,
            roles: [
              {
                id: superadminRole.id,
                name: superadminRole.name
              }
            ]
          }
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`Error generating super admin ${superAdminSeed.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error generating super admin');
    }
  }

  /**
   * Actualizar todos los modulos con sus permisos y asignarlos a SUPER_ADMIN
   * @returns Datos actualizados
   */
  async updateDataSeed(): Promise<any> {
    try {
      // Verificar si el superadmin existe
      const superadminRole = await this.prisma.rol.findFirst({
        where: { name: rolSuperAdminSeed.name }
      });

      if (!superadminRole) {
        throw new NotFoundException('Superadmin role does not exist');
      }

      // Obtener módulos existentes y permisos existentes
      const existingModules = await this.prisma.module.findMany();
      const existingPermissions = await this.prisma.permission.findMany();

      // Mapear módulos y permisos existentes por su código
      const existingModulesMap = new Map(existingModules.map((m) => [m.cod, m]));
      const existingPermissionsMap = new Map(existingPermissions.map((p) => [p.cod, p]));

      // Filtrar módulos y permisos para añadir
      const modulesToAdd = modulesSeed.filter((m) => !existingModulesMap.has(m.cod));
      const permissionsToAdd = permissionsSeed.filter((p) => !existingPermissionsMap.has(p.cod));

      // Filtrar módulos y permisos para eliminar
      const modulesToRemove = existingModules.filter(
        (m) => !modulesSeed.some((seed) => seed.cod === m.cod)
      );
      const permissionsToRemove = existingPermissions.filter(
        (p) => !permissionsSeed.some((seed) => seed.cod === p.cod)
      );

      // Iniciar transacción para añadir y eliminar datos
      await this.prisma.$transaction(async (prisma) => {
        // Añadir nuevos módulos
        if (modulesToAdd.length) {
          await prisma.module.createMany({
            data: modulesToAdd,
            skipDuplicates: true
          });
        }

        // Añadir nuevos permisos
        if (permissionsToAdd.length) {
          await prisma.permission.createMany({
            data: permissionsToAdd,
            skipDuplicates: true
          });
        }

        // Eliminar módulos no deseados
        if (modulesToRemove.length) {
          for (const module of modulesToRemove) {
            await prisma.module.delete({
              where: { id: module.id }
            });
            await prisma.modulePermissions.deleteMany({
              where: { moduleId: module.id }
            });
          }
        }

        // Eliminar permisos no deseados
        if (permissionsToRemove.length) {
          for (const permission of permissionsToRemove) {
            await prisma.permission.delete({
              where: { id: permission.id }
            });
            await prisma.modulePermissions.deleteMany({
              where: { permissionId: permission.id }
            });
          }
        }

        // Actualizar asignaciones de permisos a módulos y rol superadmin
        const allModules = await prisma.module.findMany();
        const allPermissions = await prisma.permission.findMany();

        const newModulePermissions = allModules.flatMap((module) =>
          allPermissions.map((permission) => ({
            moduleId: module.id,
            permissionId: permission.id
          }))
        );

        // Actualizar modulePermissions
        const newModulePermissionsCreate = await prisma.modulePermissions.createManyAndReturn({
          data: newModulePermissions,
          skipDuplicates: true
        });

        // Actualizar rolModulePermissions
        const rolModulePermissions = newModulePermissionsCreate.map((mp) => ({
          rolId: superadminRole.id,
          modulePermissionsId: mp.id
        }));

        await prisma.rolModulePermissions.createMany({
          data: rolModulePermissions,
          skipDuplicates: true
        });
      });

      return {
        message: 'Database updated successfully',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.logger.error('Error updating database seed', error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'Error updating database seed');
    }
  }
}
