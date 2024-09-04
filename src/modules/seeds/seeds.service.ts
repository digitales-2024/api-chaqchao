import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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
      const { password } = superAdminSeed;

      // Hash la contraseña del super admin
      const hashedPassword = await bcrypt.hash(password, 10);

      // Verificar si ya existe el super admin
      const superAdminExists = await this.prisma.user.findFirst({
        where: {
          email: superAdminSeed.email
        }
      });

      if (superAdminExists) {
        throw new BadRequestException('Super admin already exists');
      }

      //Sacamos los modulos y permisos
      const modulesDB = await this.prisma.module.findMany();
      const permissionsDB = await this.prisma.permission.findMany();

      //Sacamos todos los modulos del seed que no estan en la base de datos
      const modulesNotInDB = modulesSeed.filter(
        (module) => !modulesDB.some((m) => m.cod === module.cod)
      );

      //Sacamos todos los permisos del seed que no estan en la base de datos
      const permissionsNotInDB = permissionsSeed.filter(
        (permission) => !permissionsDB.some((p) => p.cod === permission.cod)
      );

      // Crear el super admin con su rol super admin y los modulos y permisos
      const superAdmin = await this.prisma.$transaction(async (prisma) => {
        // Crear el super admin
        const superAdmin = await prisma.user.create({
          data: {
            ...superAdminSeed,
            password: hashedPassword
          }
        });

        // Crear el rol super admin
        const rolSuperAdmin = await prisma.rol.create({
          data: rolSuperAdminSeed
        });

        // Asignar el rol super admin al super admin
        await prisma.userRol.create({
          data: {
            userId: superAdmin.id,
            rolId: rolSuperAdmin.id
          }
        });

        // Creamos todos los modulos que no estan en la base de datos
        const modulesCreate = await prisma.module.createManyAndReturn({
          data: modulesNotInDB
        });

        // Creamos todos los permisos que no estan en la base de datos
        const permissionsCreate = await prisma.permission.createManyAndReturn({
          data: permissionsNotInDB
        });

        // Asignar todos los modulos y permisos al rol super admin
        for (const module of modulesCreate) {
          //Obtener los permisos del modulo
          const permissionsModule = permissionsCreate.filter((permission) =>
            permission.cod.includes(module.cod)
          );

          await prisma.module_Permissions.createMany({
            data: permissionsModule.map((permission) => ({
              rolId: rolSuperAdmin.id,
              moduleId: module.id,
              permissionId: permission.id
            }))
          });
        }

        return {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          roles: [
            {
              id: rolSuperAdmin.id,
              name: rolSuperAdminSeed.name
            }
          ]
        };
      });

      return {
        message: 'Super admin created successfully',
        statusCode: HttpStatus.CREATED,
        data: superAdmin
      };
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
  async updateModulePermissionsSuperAdmin(): Promise<Omit<HttpResponse, 'data'>> {
    try {
      // Buscamos si el rol super admin existe
      const rolSuperAdmin = await this.prisma.rol.findFirst({
        where: {
          name: rolSuperAdminSeed.name
        }
      });

      if (!rolSuperAdmin) {
        throw new BadRequestException('Rol SuperAdmin not created');
      }

      //Sacamos los modulos y permisos de la base de datos
      const modulesDB = await this.prisma.module.findMany();
      const permissionsDB = await this.prisma.permission.findMany();

      //Sacamos todos los modulos del seed que no estan en la base de datos
      const modulesNotInDB = modulesSeed.filter(
        (module) => !modulesDB.some((m) => m.cod === module.cod)
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ modulesNotInDB:',
        modulesNotInDB
      );

      //Sacamos todos los permisos del seed que no estan en la base de datos
      const permissionsSeedNotInDB = permissionsSeed.filter(
        (permission) => !permissionsDB.some((p) => p.cod === permission.cod)
      );

      //Vemos que los permisos del seed que no estan en la base de datos tengan un modulo que si este en la base de datos o en el seed de modulos
      const permissionsNotInDBOrSeedWithModule = permissionsSeedNotInDB.filter((permission) => {
        const module =
          modulesDB.find((m) => permission.cod.includes(m.cod)) ||
          modulesSeed.find((m) => permission.cod.includes(m.cod));
        return module;
      });
      console.log(
        '🚀 ~ SeedsService ~ permissionsNotInDBOrSeedWithModule ~ permissionsNotInDBOrSeedWithModule:',
        permissionsNotInDBOrSeedWithModule
      );

      //Sacamos los modulos de los permisos que se van a agregar
      const modulesPermissions = permissionsNotInDBOrSeedWithModule.map(
        (permission) =>
          modulesDB.find((m) => permission.cod.includes(m.cod)) ||
          modulesSeed.find((m) => permission.cod.includes(m.cod))
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ modulesPermissions:',
        modulesPermissions
      );

      //Agrupamos los modulos que sacamos antes solo aquellos que si estan en la base de datos
      const modulesDBPermissions = modulesPermissions.filter((module) =>
        modulesDB.some((m) => m.cod === module.cod)
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ modulesDBPermissions:',
        modulesDBPermissions
      );

      //Agrupamos los modulos que sacamos antes solo aquellos que no estan en la base de datos
      const modulesNotInDBPermissions = modulesPermissions.filter(
        (module) => !modulesDB.some((m) => m.cod === module.cod)
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ modulesNotInDBPermissions:',
        modulesNotInDBPermissions
      );

      //Separamos aquellos permisos que su modulo esta la base de datos y en otro arreglo los que no
      const permissionsInDB = permissionsNotInDBOrSeedWithModule.filter((permission) =>
        modulesDB.some((module) => permission.cod.includes(module.cod))
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ permissionsInDB:',
        permissionsInDB
      );

      const permissionsNotInDB = permissionsNotInDBOrSeedWithModule.filter(
        (permission) => !permissionsInDB.some((p) => p.cod === permission.cod)
      );
      console.log(
        '🚀 ~ SeedsService ~ updateModulePermissionsSuperAdmin ~ permissionsNotInDB:',
        permissionsNotInDB
      );

      //Si no hay modulos o permisos a actualizar
      if (!modulesNotInDB.length && !permissionsNotInDBOrSeedWithModule.length) {
        return {
          message: 'Modules and permissions already updated',
          statusCode: HttpStatus.OK
        };
      }

      // Actualizar los modulos y permisos
      await this.prisma.$transaction(async (prisma) => {
        // Creamos todos los modulos que no estan en la base de datos
        const modulesCreate = await prisma.module.createManyAndReturn({
          data: modulesNotInDB
        });

        // Creamos todos los permisos que no estan en la base de datos
        const permissionsCreate = await prisma.permission.createManyAndReturn({
          data: permissionsNotInDBOrSeedWithModule
        });

        //Asignamos los permisos a los modulos que si estan en la base de datos
        for (const module of modulesDBPermissions) {
          //Obtenemos los permisos del modulo
          const permissionsModule = permissionsCreate.filter((permission) =>
            permission.cod.includes(module.cod)
          );

          //Buscamos el modulo en la base de datos
          const moduleDB = modulesDB.find((m) => m.cod === module.cod);

          await prisma.module_Permissions.createMany({
            data: permissionsModule.map((permission) => ({
              rolId: rolSuperAdmin.id,
              moduleId: moduleDB.id,
              permissionId: permission.id
            }))
          });
        }

        //Asignamos los permisos a los modulos que no estan en la base de datos
        for (const module of modulesNotInDBPermissions) {
          //Obtenemos los permisos del modulo
          const permissionsModule = permissionsCreate.filter((permission) =>
            permission.cod.includes(module.cod)
          );

          //Buscamos el modulo en los modulos creados
          const moduleCreated = modulesCreate.find((m) => m.cod === module.cod);

          await prisma.module_Permissions.createMany({
            data: permissionsModule.map((permission) => ({
              rolId: rolSuperAdmin.id,
              moduleId: moduleCreated.id,
              permissionId: permission.id
            }))
          });
        }
      });

      return {
        message: 'Modules and permissions updated successfully',
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.logger.error('Error updating all data', error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error updating all data');
    }
  }
}
