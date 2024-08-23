import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException, NoDataUpdate } from 'src/utils';
import { ValidRols } from '../auth/interfaces';
import { UpdateRolDto } from './dto/update-rol.dto';
import { HttpResponse, ModulePermissions, ModulePermissionsData } from 'src/interfaces';
import { RolPermissions } from 'src/interfaces/rol.type';

@Injectable()
export class RolService {
  private readonly logger = new Logger(RolService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo rol
   * @param createRolDto Datos del rol a crear
   * @param user Usuario que crea el rol
   * @returns Datos del rol creado
   */
  async create(createRolDto: CreateRolDto): Promise<HttpResponse<RolPermissions>> {
    try {
      const { name, description, modulePermissions } = createRolDto;

      const rolExist = await this.checkExitByName(name);

      if (rolExist) {
        throw new BadRequestException('Rol already exists');
      }

      const newRol = await this.prisma.rol.create({
        data: {
          name,
          description
        },
        select: { id: true, name: true, description: true }
      });

      try {
        // Asignar módulos y permisos dentro de una transacción
        const createModulePermissions = await this.assignPermissionsToRol(
          newRol.id,
          modulePermissions
        );
        return {
          statusCode: HttpStatus.CREATED,
          message: 'Rol created',
          data: {
            ...newRol,
            modulePermissions: createModulePermissions
          }
        };
      } catch (error) {
        // Si ocurre un error en la transacción, eliminar el rol creado
        await this.prisma.rol.delete({
          where: { id: newRol.id }
        });
        throw error;
      }
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
  async update(id: string, updateRolDto: UpdateRolDto): Promise<HttpResponse<RolPermissions>> {
    try {
      const { name, modulePermissions } = updateRolDto;

      // Validar que haya datos para actualizar
      if (NoDataUpdate(updateRolDto)) {
        throw new BadRequestException('No data to update');
      }

      // Validar que el rol no sea SUPER_ADMIN
      if (name === ValidRols.SUPER_ADMIN) {
        throw new BadRequestException('Rol name is invalid');
      }

      // Verificar si el nombre ya existe
      if (name) {
        const rolExist = await this.findByName(name);

        if (!!rolExist && rolExist.id !== id) {
          throw new BadRequestException('Rol already exists with this name');
        }
      }

      // Buscar el rol en la base de datos
      const rolDB = await this.findById(id);
      if (!rolDB) {
        throw new BadRequestException('Rol not found');
      }

      // Inicia una transacción para actualizar el rol y sus permisos
      const updateRol = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el rol con los nuevos datos
        const rolUpdate = await prisma.rol.update({
          where: { id },
          data: {
            name,
            description: updateRolDto.description
          },
          select: {
            id: true,
            name: true,
            description: true
          }
        });

        // Actualizar los permisos del rol si se proporciona `modulePermissions`
        let updatedPermissions: ModulePermissionsData[] = [];
        if (modulePermissions) {
          updatedPermissions = await this.updatePermissionsToRol(id, modulePermissions);
        }

        return { ...rolUpdate, modulePermissions: updatedPermissions };
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
   * @returns  Datos del rol eliminado
   */
  async remove(id: string): Promise<HttpResponse<RolPermissions>> {
    try {
      // Validar fuera de la transacción
      const rolIsSuperAdmin = await this.isRolSuperAdmin(id);
      if (rolIsSuperAdmin) {
        throw new BadRequestException(
          'It is not possible to delete the rol because it is super admin'
        );
      }

      const rolIsUsed = await this.rolIsUsed(id);
      if (rolIsUsed) {
        throw new BadRequestException('It is not possible to delete the rol because it is in use');
      }

      // Inicia la transacción
      const removeRol = await this.prisma.$transaction(async (prisma) => {
        // Eliminar primero las relaciones en module_Permissions
        await prisma.module_Permissions.deleteMany({
          where: {
            rolId: id
          }
        });

        // Luego eliminar el rol
        const rolDelete = await prisma.rol.delete({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            rolPermissions: {
              select: {
                id: true,
                module: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                permission: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        return {
          id: rolDelete.id,
          name: rolDelete.name,
          description: rolDelete.description,
          modulePermissions: rolDelete.rolPermissions.map((rolPermission) => ({
            module: {
              id: rolPermission.module.id,
              name: rolPermission.module.name
            },
            permissions: [rolPermission.permission]
          }))
        };
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
  async findAll(): Promise<RolPermissions[]> {
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
          description: true,
          rolPermissions: {
            select: {
              id: true,
              module: {
                select: {
                  id: true,
                  name: true
                }
              },
              permission: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!rolsDB) throw new BadRequestException('Rols not found');

      return rolsDB.map((rol) => ({
        id: rol.id,
        name: rol.name,
        description: rol.description,
        modulePermissions: rol.rolPermissions.map((rolPermission) => ({
          module: {
            id: rolPermission.module.id,
            name: rolPermission.module.name
          },
          permissions: [rolPermission.permission]
        }))
      }));
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
  async findById(id: string): Promise<RolPermissions> {
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
          description: true,
          rolPermissions: {
            select: {
              id: true,
              module: {
                select: {
                  id: true,
                  name: true
                }
              },
              permission: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!rolDB) throw new BadRequestException('Rol not found for id');

      return {
        id: rolDB.id,
        name: rolDB.name,
        description: rolDB.description,
        modulePermissions: rolDB.rolPermissions.map((rolPermission) => ({
          module: {
            id: rolPermission.module.id,
            name: rolPermission.module.name
          },
          permissions: [rolPermission.permission]
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting a rol for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error getting a rol');
    }
  }

  /**
   * Buscar un rol por su nombre
   * @param name Nombre del rol a buscar
   * @returns Datos del rol encontrado
   */
  async findByName(name: string): Promise<RolPermissions | null> {
    try {
      const rolDB = await this.prisma.rol.findUnique({
        where: {
          name_isActive: {
            name,
            isActive: true
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          rolPermissions: {
            select: {
              id: true,
              module: {
                select: {
                  id: true,
                  name: true
                }
              },
              permission: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      let rolPermissions: RolPermissions = null;
      if (rolDB) {
        rolPermissions = {
          id: rolDB.id,
          name: rolDB.name,
          description: rolDB.description,
          modulePermissions: rolDB.rolPermissions.map((rolPermission) => ({
            module: {
              id: rolPermission.module.id,
              name: rolPermission.module.name
            },
            permissions: [rolPermission.permission]
          }))
        };
      }

      return rolPermissions;
    } catch (error) {
      this.logger.error(`Error getting a rol for name: ${name}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error getting a rol');
    }
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

  /**
   * Asignar permisos a un rol existente
   * @param rolId Id del rol al que se le asignarán los permisos
   * @param modulePermissions Permisos a asignar al rol
   * @returns Datos del rol con los permisos asignados
   */
  private async assignPermissionsToRol(
    roleId: string,
    modulePermissions: ModulePermissions[]
  ): Promise<ModulePermissionsData[]> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const assignedPermissions: ModulePermissionsData[] = [];

        for (const { moduleId, permissionIds } of modulePermissions) {
          // Verificar si el módulo existe
          const moduleExist = await prisma.module.findUnique({
            where: {
              id: moduleId
            },
            select: {
              id: true,
              name: true
            }
          });

          if (!moduleExist) {
            throw new BadRequestException('Module not found');
          }

          const permissions = [];
          for (const permissionId of permissionIds) {
            // Verificar si el permiso existe
            const permissionExist = await prisma.permission.findUnique({
              where: {
                id: permissionId
              },
              select: {
                id: true,
                name: true
              }
            });

            if (!permissionExist) {
              throw new BadRequestException('Permission not found');
            }

            // Verificar si la relación ya existe
            const existingRelation = await prisma.module_Permissions.findUnique({
              where: {
                moduleId_permissionId_rolId: {
                  moduleId,
                  permissionId,
                  rolId: roleId
                }
              }
            });

            if (existingRelation) {
              throw new BadRequestException('Permission already assigned to rol');
            }

            // Crear la relación si no existe
            const newModulePermission = await prisma.module_Permissions.create({
              data: {
                moduleId: moduleExist.id,
                permissionId: permissionExist.id,
                rolId: roleId
              },
              select: {
                module: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                permission: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            });

            permissions.push(newModulePermission.permission);
          }
          assignedPermissions.push({
            module: {
              id: moduleExist.id,
              name: moduleExist.name
            },
            permissions: permissions
          });
        }

        return assignedPermissions;
      });
    } catch (error) {
      this.logger.error(`Error assigning permissions to rol for id: ${roleId}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error assigning permissions to rol');
    }
  }

  /**
   * Actualizar los permisos de un rol existente
   * @param roleId Id del rol al que se le actualizarán los permisos
   * @param modulePermissions Permisos a actualizar al rol
   * @returns Datos del rol con los permisos actualizados
   */
  async updatePermissionsToRol(
    roleId: string,
    modulePermissions: ModulePermissions[]
  ): Promise<ModulePermissionsData[]> {
    try {
      // Eliminar módulos duplicados y fusionar permisos
      const uniqueModulePermissions: Record<string, Set<string>> = {};

      for (const { moduleId, permissionIds } of modulePermissions) {
        if (!uniqueModulePermissions[moduleId]) {
          uniqueModulePermissions[moduleId] = new Set(permissionIds);
        } else {
          permissionIds.forEach((permissionId) =>
            uniqueModulePermissions[moduleId].add(permissionId)
          );
        }
      }

      return await this.prisma.$transaction(async (prisma) => {
        const updatedPermissions: ModulePermissionsData[] = [];

        // Obtener todos los módulos asignados actualmente al rol
        const currentModulePermissions = await prisma.module_Permissions.findMany({
          where: { rolId: roleId },
          select: { moduleId: true }
        });
        const currentModuleIds = new Set(currentModulePermissions.map((mp) => mp.moduleId));

        // Iterar sobre los módulos y permisos únicos a actualizar
        for (const moduleId of Object.keys(uniqueModulePermissions)) {
          const permissionIds = Array.from(uniqueModulePermissions[moduleId]);

          // Verificar si el módulo existe y obtener su nombre
          const moduleExist = await prisma.module.findUnique({
            where: { id: moduleId },
            select: { id: true, name: true }
          });

          if (!moduleExist) {
            throw new BadRequestException('Module not found');
          }

          const permissions: { id: string; name: string }[] = [];

          // Obtener los permisos existentes de la base de datos en una sola consulta
          const existingPermissions = await prisma.permission.findMany({
            where: {
              id: { in: permissionIds }
            },
            select: { id: true, name: true }
          });

          const existingPermissionIds = new Set(existingPermissions.map((p) => p.id));

          // Solo crear relaciones para permisos que no existen ya para este rol y módulo
          for (const permission of existingPermissions) {
            const existingRelation = await prisma.module_Permissions.findUnique({
              where: {
                moduleId_permissionId_rolId: {
                  moduleId,
                  permissionId: permission.id,
                  rolId: roleId
                }
              }
            });

            // Crear la relación si no existe
            if (!existingRelation) {
              await prisma.module_Permissions.create({
                data: {
                  moduleId: moduleExist.id,
                  permissionId: permission.id,
                  rolId: roleId
                }
              });
            }

            permissions.push(permission);
          }

          // Eliminar permisos que ya no están en la lista
          const modulePermissionsDB = await prisma.module_Permissions.findMany({
            where: { rolId: roleId, moduleId },
            select: {
              permission: {
                select: { id: true, name: true }
              }
            }
          });

          for (const modulePermission of modulePermissionsDB) {
            if (!existingPermissionIds.has(modulePermission.permission.id)) {
              await prisma.module_Permissions.delete({
                where: {
                  moduleId_permissionId_rolId: {
                    moduleId,
                    permissionId: modulePermission.permission.id,
                    rolId: roleId
                  }
                }
              });
            }
          }

          // Añadir al listado de permisos actualizados
          updatedPermissions.push({
            module: {
              id: moduleExist.id,
              name: moduleExist.name
            },
            permissions
          });

          // Remover el módulo del set de módulos actuales ya que está presente en la actualización
          currentModuleIds.delete(moduleId);
        }

        // Eliminar los módulos que ya no están en la lista de actualización
        for (const moduleId of currentModuleIds) {
          await prisma.module_Permissions.deleteMany({
            where: {
              rolId: roleId,
              moduleId: moduleId
            }
          });
        }

        return updatedPermissions;
      });
    } catch (error) {
      this.logger.error(`Error updating permissions to rol for id: ${roleId}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error updating permissions to rol');
    }
  }
}
