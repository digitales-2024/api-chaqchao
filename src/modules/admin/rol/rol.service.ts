import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException, NoDataUpdate } from 'src/utils';
import { ValidRols } from '../auth/interfaces';
import { UpdateRolDto } from './dto/update-rol.dto';
import { HttpResponse, Rol, UserData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolService {
  private readonly logger = new Logger(RolService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  /**
   * Crear un nuevo rol
   * @param createRolDto Datos del rol a crear
   * @param user Usuario que crea el rol
   * @returns Datos del rol creado
   */
  async create(createRolDto: CreateRolDto, user: any): Promise<HttpResponse<Rol>> {
    try {
      const { name } = createRolDto;

      const newRol = await this.prisma.$transaction(async (prisma) => {
        const rolExist = await this.checkExitByName(name);

        if (rolExist) {
          throw new BadRequestException('Rol already exists');
        }

        const newRol = await prisma.rol.create({
          data: createRolDto,
          select: { id: true, name: true, description: true }
        });

        await this.audit.create({
          entityId: newRol.id,
          entityType: 'rol',
          action: AuditActionType.CREATE,
          performedById: user.id,
          createdAt: new Date()
        });

        return newRol;
      });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Rol created',
        data: newRol
      };
    } catch (error) {
      this.logger.error(`Error creating a rol for name: ${createRolDto.name}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a rol');
    }
  }

  /**
   * Actualizar un rol existente en la base de datos por su id
   * @param id Id del rol a actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @param user Usuario que actualiza el rol
   * @returns  Datos del rol actualizado
   */
  async update(id: string, updateRolDto: UpdateRolDto, user: UserData): Promise<HttpResponse<Rol>> {
    try {
      const updateRol = await this.prisma.$transaction(async (prisma) => {
        const { name } = updateRolDto;

        if (NoDataUpdate(updateRolDto)) {
          throw new BadRequestException('No data to update');
        }

        if (updateRolDto.name === ValidRols.SUPER_ADMIN) {
          throw new BadRequestException('Rol name is invalid');
        }

        if (updateRolDto.name) {
          const rolExist = await this.checkExitByName(name);

          if (rolExist) {
            throw new BadRequestException('Rol already exists');
          }
        }

        const rolDB = await this.findById(id);

        if (!rolDB) {
          throw new BadRequestException('Rol not found');
        }

        const rolUpdate = await prisma.rol.update({
          where: {
            id
          },
          data: updateRolDto,
          select: {
            id: true,
            name: true,
            description: true
          }
        });

        await this.audit.create({
          entityId: id,
          entityType: 'rol',
          action: AuditActionType.UPDATE,
          performedById: user.id,
          createdAt: new Date()
        });

        return rolUpdate;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Rol updated',
        data: updateRol
      };
    } catch (error) {
      this.logger.error(`Error updating a rol for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error updating a rol');
    }
  }

  /**
   * Eliminar un rol existente en la base de datos por su id
   * @param id Id del rol a eliminar
   * @param user Usuario que elimina el rol
   * @returns  Datos del rol eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<Rol>> {
    try {
      const removeRol = await this.prisma.$transaction(async (prisma) => {
        const rolIsSuperAdmin = await this.isRolSuperAdmin(id);

        if (rolIsSuperAdmin) {
          throw new BadRequestException(
            'It is not possible to delete the rol because it is super admin'
          );
        }

        const rolIsUsed = await this.rolIsUsed(id);

        if (rolIsUsed) {
          throw new BadRequestException(
            'It is not possible to delete the rol because it is in use'
          );
        }

        const rolDelete = await prisma.rol.delete({
          where: {
            id
          },
          select: {
            id: true,
            name: true,
            description: true
          }
        });

        await this.audit.create({
          entityId: id,
          entityType: 'rol',
          action: AuditActionType.DELETE,
          performedById: user.id,
          createdAt: new Date()
        });

        return rolDelete;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Rol deleted',
        data: removeRol
      };
    } catch (error) {
      this.logger.error(`Error deleting a rol for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deleting a rol');
    }
  }

  /**
   * Mostrar todos los roles activos
   * @returns Datos de los roles activos
   */
  async findAll(): Promise<Rol[]> {
    try {
      const rolsDB = await this.prisma.rol.findMany({
        where: {
          isActive: true,
          name: {
            not: ValidRols.SUPER_ADMIN
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      if (!rolsDB) throw new BadRequestException('Rols not found');

      return rolsDB;
    } catch (error) {
      this.logger.error('Error getting all rols', error.stack);
      handleException(error, 'Error getting all rols');
    }
  }

  /**
   * Verificar si el rol ya existe en la base de datos
   * @param name Nombre del rol
   */
  async checkExitByName(name: string): Promise<boolean> {
    const rolDB = await this.prisma.rol.findUnique({
      where: {
        name_isActive: {
          name,
          isActive: true
        }
      }
    });

    return !!rolDB;
  }

  /**
   * Buscar un rol por su id
   * @param id Id del rol a buscar
   * @returns Datos del rol encontrado
   */
  async findById(id: string): Promise<Rol> {
    try {
      const rolDB = await this.prisma.rol.findUnique({
        where: {
          id,
          isActive: true,
          name: {
            not: ValidRols.SUPER_ADMIN
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      if (!rolDB) throw new BadRequestException('Rol not found for id');

      return rolDB;
    } catch (error) {
      this.logger.error(`Error getting a rol for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error getting a rol');
    }
  }

  async findUserRol(userId: string) {
    const userRolDB = await this.prisma.userRol.findFirst({
      where: {
        userId,
        isActive: true
      },
      select: {
        rol: {
          select: {
            name: true,
            id: true,
            isActive: true,
            description: true
          }
        }
      }
    });

    if (!userRolDB) {
      throw new BadRequestException('User rols not found');
    }

    return userRolDB.rol;
  }

  /**
   * Verificar si el rol es superadmin
   * @param id Id del rol a verificar si es superadmin
   */
  async isRolSuperAdmin(id: string): Promise<boolean> {
    const userRolDB = await this.prisma.rol.findUnique({
      where: {
        id
      },
      select: {
        name: true
      }
    });

    if (!userRolDB) {
      throw new BadRequestException('Rol not found');
    }

    return !!(userRolDB.name === ValidRols.SUPER_ADMIN);
  }

  /**
   * Verificar si el rol está en uso
   * @param id Id del rol a verificar si esta en uso
   */

  async rolIsUsed(id: string): Promise<boolean> {
    const rolIsUsed = await this.prisma.userRol.findFirst({
      where: {
        rolId: id,
        isActive: true
      }
    });

    return !!rolIsUsed;
  }

  async isRolDesactive(rolId: string): Promise<boolean> {
    const userRolDB = await this.prisma.rol.findFirst({
      where: {
        id: rolId,
        isActive: false
      }
    });

    return userRolDB ? true : false;
  }

  async ensureAdminUser(): Promise<void> {
    const adminRol = await this.prisma.rol.findUnique({
      where: {
        name_isActive: {
          name: ValidRols.ADMIN,
          isActive: true
        }
      }
    });

    if (!adminRol) {
      await this.create(
        {
          name: ValidRols.ADMIN,
          description: 'Administrator'
        },
        { id: 'admin' }
      );
    }
  }
}
