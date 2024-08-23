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
  async generateSuperAdmin(): Promise<HttpResponse<UserData>> {
    try {
      const superAdmin = await this.prisma.$transaction(async (prisma) => {
        const { password } = superAdminSeed;

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdminExists = await prisma.user.findFirst({
          where: {
            email: superAdminSeed.email
          }
        });

        if (superAdminExists) {
          throw new BadRequestException('Super admin already exists');
        }

        const superAdmin = await prisma.user.create({
          data: {
            ...superAdminSeed,
            password: hashedPassword
          }
        });

        const rolSuperAdmin = await prisma.rol.create({
          data: rolSuperAdminSeed
        });

        await prisma.userRol.create({
          data: {
            userId: superAdmin.id,
            rolId: rolSuperAdmin.id
          }
        });

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
      handleException(error, 'Error generating super admin');
    }
  }

  /**
   * Generar los módulos de la aplicación
   * @returns Módulos creados
   */
  async generateModules() {
    try {
      const modules = await this.prisma.$transaction(async (prisma) => {
        const modules = await prisma.module.createMany({
          data: modulesSeed.map((module) => ({
            cod: module.cod,
            name: module.name,
            description: module.description
          }))
        });

        return modules;
      });

      return {
        message: 'Modules created successfully',
        statusCode: HttpStatus.CREATED,
        data: modules
      };
    } catch (error) {
      this.logger.error('Error generating modules', error.stack);
      handleException(error, 'Error generating modules');
    }
  }

  /**
   * Generar los permisos de la aplicación
   * @returns Permisos creados
   */
  async generatePermissions() {
    try {
      const permissions = await this.prisma.$transaction(async (prisma) => {
        const permissions = await prisma.permission.createMany({
          data: permissionsSeed.map((permission) => ({
            cod: permission.cod,
            name: permission.name,
            description: permission.description
          }))
        });

        return permissions;
      });

      return {
        message: 'Permissions created successfully',
        statusCode: HttpStatus.CREATED,
        data: permissions
      };
    } catch (error) {
      this.logger.error('Error generating permissions', error.stack);
      handleException(error, 'Error generating permissions');
    }
  }
}
