import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { ValidRols } from '../auth/interfaces';
import { UpdateRolDto } from './dto/update-rol.dto';
import { HttpResponse, ModulePermissionsData } from 'src/interfaces';
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

      // Validar si el rol ya existe
      const rolExist = await this.prisma.rol.findUnique({
        where: {
          name_isActive: {
            name,
            isActive: true
          }
        }
      });

      if (rolExist) {
        throw new ConflictException('Role already exists');
      }

      // Crear el nuevo rol
      const newRol = await this.prisma.rol.create({
        data: {
          name,
          description
        },
        select: { id: true, name: true, description: true }
      });

      try {
        // Asignar módulos y permisos dentro de una transacción
        const createModulePermissions = await this.prisma.$transaction(async (prisma) => {
          return await this.assignPermissionsToRol(prisma, newRol.id, modulePermissions);
        });

        return {
          statusCode: HttpStatus.CREATED,
          message: 'Role created successfully',
          data: {
            ...newRol,
            modulePermissions: createModulePermissions
          }
        };
      } catch (error) {
        // Si ocurre un error en la asignación de permisos, eliminar el rol creado
        await this.prisma.rol.delete({
          where: { id: newRol.id }
        });
        throw new BadRequestException('Error assigning permissions to role');
      }
    } catch (error) {
      this.logger.error(`Error creating a role for name: ${createRolDto.name}`, error.stack);
      throw new BadRequestException(error.message || 'Error creating role');
    }
  }

  /**
   * Asignar permisos a un rol existente
   * @param prisma Instancia de PrismaService
   * @param rolId Id del rol a asignar permisos
   * @param modulePermissions Permisos a asignar al rol
   * @returns Datos del rol con los permisos asignados
   */
  private async assignPermissionsToRol(
    prisma: any,
    rolId: string,
    modulePermissions: any[]
  ): Promise<any> {
    // Implementa la lógica para asignar permisos a un rol
    // Asegúrate de que esta función también maneje transacciones si es necesario

    // Aquí hay un ejemplo básico, ajusta según tu lógica:
    const modulePermissionsPromises = modulePermissions.map((permission) =>
      prisma.modulePermissions.create({
        data: {
          moduleId: permission.moduleId,
          permissionId: permission.permissionId
        }
      })
    );

    // Crea las relaciones entre rol y permisos
    const rolModulePermissions = modulePermissions.map((modulePermission) => ({
      rolId,
      modulePermissionsId: modulePermission.id
    }));

    // Asegúrate de crear los permisos del rol dentro de la transacción
    await prisma.rolModulePermissions.createMany({
      data: rolModulePermissions,
      skipDuplicates: true
    });

    return await Promise.all(modulePermissionsPromises);
  }

  /**
   * Actualiza un rol existente en la base de datos por su id.
   * @param id Id del rol a actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @returns Datos del rol actualizado
   */
  async update(id: string, updateRolDto: UpdateRolDto): Promise<HttpResponse<any>> {
    try {
      const { name, modulePermissions } = updateRolDto;

      // Validar que el rol no sea SUPER_ADMIN
      const rolIsSuperAdmin = await this.isRolSuperAdmin(id);
      if (rolIsSuperAdmin) {
        throw new BadRequestException('Cannot update the role because it is super admin');
      }

      // Validar que haya datos para actualizar
      if (this.isNoDataUpdate(updateRolDto)) {
        throw new BadRequestException('No data to update');
      }

      // Validar que el nombre del rol no sea SUPER_ADMIN
      if (name === ValidRols.SUPER_ADMIN) {
        throw new BadRequestException('Role name is invalid');
      }

      // Verificar si el nombre ya existe
      if (name) {
        const existingRole = await this.findByName(name);
        if (existingRole && existingRole.id !== id) {
          throw new ConflictException('Role already exists with this name');
        }
      }

      // Buscar el rol en la base de datos
      const roleInDb = await this.findById(id);
      if (!roleInDb) {
        throw new NotFoundException('Role not found');
      }

      // Iniciar una transacción para actualizar el rol y sus permisos
      const updatedRole = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el rol con los nuevos datos
        const updatedRoleData = await prisma.rol.update({
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
        if (modulePermissions) {
          await this.updatePermissionsToRol(prisma as PrismaService, id, modulePermissions);
        }

        return { ...updatedRoleData, modulePermissions };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Role updated successfully',
        data: updatedRole
      };
    } catch (error) {
      this.logger.error(`Error updating role with id: ${id}`, error.stack);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error('Internal server error');
    }
  }

  private async updatePermissionsToRol(
    prisma: PrismaService,
    rolId: string,
    modulePermissions: any[]
  ): Promise<void> {
    // Primero eliminar los permisos existentes
    await prisma.rolModulePermissions.deleteMany({
      where: { rolId }
    });

    // Insertar o actualizar permisos
    for (const permission of modulePermissions) {
      await prisma.modulePermissions.upsert({
        where: {
          moduleId_permissionId: {
            moduleId: permission.moduleId,
            permissionId: permission.permissionId
          }
        },
        update: {
          // Actualizar si es necesario
        },
        create: {
          moduleId: permission.moduleId,
          permissionId: permission.permissionId
        }
      });

      await prisma.rolModulePermissions.create({
        data: {
          rolId,
          modulePermissionsId: permission.permissionId // Ajusta si es necesario
        }
      });
    }
  }

  private isNoDataUpdate(updateRolDto: UpdateRolDto): boolean {
    // Implementa la lógica para verificar si no hay datos para actualizar
    return !updateRolDto.name && !updateRolDto.description && !updateRolDto.modulePermissions;
  }

  /**
   * Verifica si un rol es el rol de superadministrador.
   * @param id Id del rol a verificar
   * @returns True si el rol es el rol de superadministrador, false en caso contrario
   */
  async isRolSuperAdmin(id: string): Promise<boolean> {
    const superAdminRoleName = 'SUPER_ADMIN'; // O usa una constante o configuración

    // Buscar el rol por id
    const role = await this.prisma.rol.findUnique({
      where: { id },
      select: { name: true }
    });

    // Verificar si el rol existe y si es el rol de superadministrador
    return role ? role.name === superAdminRoleName : false;
  }

  /**
   * Eliminar un rol existente en la base de datos por su id
   * @param id Id del rol a eliminar
   * @returns  Datos del rol eliminado
   */
  async remove(id: string): Promise<HttpResponse<any>> {
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
        // Eliminar primero las relaciones en RoleModulePermission
        await prisma.rolModulePermissions.deleteMany({
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
            rolModulePermissions: {
              select: {
                id: true,
                modulePermissions: {
                  select: {
                    id: true,
                    module: {
                      select: {
                        id: true,
                        cod: true,
                        name: true,
                        description: true
                      }
                    },
                    permission: {
                      select: {
                        id: true,
                        cod: true,
                        name: true,
                        description: true
                      }
                    }
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
          modulePermissions: rolDelete.rolModulePermissions.map((rolModulePermission) => ({
            module: {
              id: rolModulePermission.modulePermissions.module.id,
              cod: rolModulePermission.modulePermissions.module.cod,
              name: rolModulePermission.modulePermissions.module.name,
              description: rolModulePermission.modulePermissions.module.description
            },
            permissions: [rolModulePermission.modulePermissions.permission]
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
   * Obtener todos los roles con sus módulos y permisos
   * @returns Lista de roles con módulos y permisos
   */
  async findAll(): Promise<any> {
    try {
      // Recupera todos los roles activos con sus permisos asociados
      const roles = await this.prisma.rol.findMany({
        where: { isActive: true },
        include: {
          rolModulePermissions: {
            include: {
              modulePermissions: {
                include: {
                  module: true, // Incluye el módulo asociado
                  permission: true // Incluye el permiso asociado
                }
              }
            }
          }
        }
      });

      // Agrupa permisos por módulos
      const groupedRoles = roles.map((role) => {
        const modulesMap = new Map<string, { module: any; permissions: any }>();

        role.rolModulePermissions.forEach((rolModulePermission) => {
          const moduleId = rolModulePermission.modulePermissions.moduleId;

          if (!modulesMap.has(moduleId)) {
            modulesMap.set(moduleId, {
              module: {
                id: rolModulePermission.modulePermissions.module.id,
                cod: rolModulePermission.modulePermissions.module.cod,
                name: rolModulePermission.modulePermissions.module.name,
                description: rolModulePermission.modulePermissions.module.description
              },
              permissions: []
            });
          }

          modulesMap
            .get(moduleId)
            ?.permissions.push(rolModulePermission.modulePermissions.permission);
        });

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          modulePermissions: Array.from(modulesMap.values())
        };
      });

      return groupedRoles;
    } catch (error) {
      this.logger.error('Error getting roles with modules and permissions', error.stack);
      throw new Error('Error getting roles with modules and permissions');
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
      // Buscar el rol en la base de datos
      const rolDB = await this.prisma.rol.findUnique({
        where: {
          id,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          rolModulePermissions: {
            select: {
              modulePermissions: {
                select: {
                  id: true,
                  module: {
                    select: {
                      id: true,
                      cod: true,
                      name: true,
                      description: true
                    }
                  },
                  permission: {
                    select: {
                      id: true,
                      cod: true,
                      name: true,
                      description: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Verificar si el rol fue encontrado
      if (!rolDB) throw new BadRequestException('Rol not found for id');

      // Agrupar permisos por módulos
      const groupedRols = this.groupPermissionsByModules([rolDB]);

      return groupedRols[0];
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
  async findByName(name: string): Promise<any | null> {
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
          rolModulePermissions: {
            select: {
              modulePermissions: {
                select: {
                  id: true,
                  module: {
                    select: {
                      id: true,
                      cod: true,
                      name: true,
                      description: true
                    }
                  },
                  permission: {
                    select: {
                      id: true,
                      cod: true,
                      name: true,
                      description: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!rolDB) {
        return null; // Rol no encontrado
      }

      // Agrupar permisos por módulo
      const groupedPermissions = rolDB.rolModulePermissions.reduce((acc, rolPermission) => {
        // Encuentra el módulo en el acumulador o créalo si no existe
        let moduleEntry = acc.find(
          (entry) => entry.module.id === rolPermission.modulePermissions.module.id
        );
        if (!moduleEntry) {
          moduleEntry = {
            module: {
              id: rolPermission.modulePermissions.module.id,
              cod: rolPermission.modulePermissions.module.cod,
              name: rolPermission.modulePermissions.module.name,
              description: rolPermission.modulePermissions.module.description
            },
            permissions: []
          };
          acc.push(moduleEntry);
        }
        // Agrega el permiso al módulo correspondiente
        moduleEntry.permissions.push(rolPermission.modulePermissions.permission);
        return acc;
      }, [] as ModulePermissionsData[]);

      return {
        id: rolDB.id,
        name: rolDB.name,
        description: rolDB.description,
        modulePermissions: groupedPermissions
      };
    } catch (error) {
      this.logger.error(`Error getting a role for name: ${name}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error getting a role');
    }
  }

  /**
  //  * Verificar si el rol es superadmin
  //  * @param id Id del rol a verificar si es superadmin
  //  */
  // async isRolSuperAdmin(id: string): Promise<boolean> {
  //   const userRolDB = await this.prisma.rol.findUnique({
  //     where: {
  //       id
  //     },
  //     select: {
  //       name: true
  //     }
  //   });

  //   if (!userRolDB) {
  //     throw new BadRequestException('Rol super admin not found');
  //   }

  //   return !!(userRolDB.name === ValidRols.SUPER_ADMIN);
  // }

  /**
   * Verificar si el rol está en uso
   * @param id Id del rol a verificar si esta en uso
   */

  async rolIsUsed(id: string): Promise<any> {
    const rolIsUsed = await this.prisma.userRol.findFirst({
      where: {
        rolId: id,
        isActive: true
      }
    });

    return !!rolIsUsed;
  }

  /**
   * Actualizar los permisos de un rol existente
   * @param roleId Id del rol al que se le actualizarán los permisos
   * @param modulePermissions Permisos a actualizar al rol
   * @returns Datos del rol con los permisos actualizados
   */
  // async updatePermissionsToRol(
  //   roleId: string,
  //   modulePermissions: ModulePermissions[]
  // ): Promise<ModulePermissionsData[]> {
  //   try {
  //     // Eliminar módulos duplicados y fusionar permisos
  //     const uniqueModulePermissions: Record<string, Set<string>> = {};

  //     for (const { moduleId, permissionIds } of modulePermissions) {
  //       if (!uniqueModulePermissions[moduleId]) {
  //         uniqueModulePermissions[moduleId] = new Set(permissionIds);
  //       } else {
  //         permissionIds.forEach((permissionId) =>
  //           uniqueModulePermissions[moduleId].add(permissionId)
  //         );
  //       }
  //     }

  //     return await this.prisma.$transaction(async (prisma) => {
  //       const updatedPermissions: ModulePermissionsData[] = [];

  //       // Obtener todos los módulos asignados actualmente al rol
  //       const currentModulePermissions = await prisma.modulePermissions.findMany({
  //         where: { rolId: roleId },
  //         select: { moduleId: true }
  //       });
  //       const currentModuleIds = new Set(currentModulePermissions.map((mp) => mp.moduleId));

  //       // Iterar sobre los módulos y permisos únicos a actualizar
  //       for (const moduleId of Object.keys(uniqueModulePermissions)) {
  //         const permissionIds = Array.from(uniqueModulePermissions[moduleId]);

  //         // Verificar si el módulo existe y obtener su nombre
  //         const moduleExist = await prisma.module.findUnique({
  //           where: { id: moduleId },
  //           select: { id: true, cod: true, name: true, description: true }
  //         });

  //         if (!moduleExist) {
  //           throw new BadRequestException('Module not found');
  //         }

  //         const permissions: {
  //           id: string;
  //           cod: string;
  //           name: string;
  //           description: string;
  //         }[] = [];

  //         // Obtener los permisos existentes de la base de datos en una sola consulta
  //         const existingPermissions = await prisma.permission.findMany({
  //           where: {
  //             id: { in: permissionIds }
  //           },
  //           select: { id: true, cod: true, name: true, description: true }
  //         });

  //         const existingPermissionIds = new Set(existingPermissions.map((p) => p.id));

  //         // Solo crear relaciones para permisos que no existen ya para este rol y módulo
  //         for (const permission of existingPermissions) {
  //           const existingRelation = await prisma.modulePermissions.findUnique({
  //             where: {
  //               moduleId_permissionId_rolId: {
  //                 moduleId,
  //                 permissionId: permission.id,
  //                 rolId: roleId
  //               }
  //             }
  //           });

  //           // Crear la relación si no existe
  //           if (!existingRelation) {
  //             await prisma.modulePermissions.create({
  //               data: {
  //                 moduleId: moduleExist.id,
  //                 permissionId: permission.id,
  //                 rolId: roleId
  //               }
  //             });
  //           }

  //           permissions.push(permission);
  //         }

  //         // Eliminar permisos que ya no están en la lista
  //         const modulePermissionsDB = await prisma.modulePermissions.findMany({
  //           where: { rolId: roleId, moduleId },
  //           select: {
  //             permission: {
  //               select: { id: true, cod: true, name: true, description: true }
  //             }
  //           }
  //         });

  //         for (const modulePermission of modulePermissionsDB) {
  //           if (!existingPermissionIds.has(modulePermission.permission.id)) {
  //             await prisma.modulePermissions.delete({
  //               where: {
  //                 moduleId_permissionId_rolId: {
  //                   moduleId,
  //                   permissionId: modulePermission.permission.id,
  //                   rolId: roleId
  //                 }
  //               }
  //             });
  //           }
  //         }

  //         // Añadir al listado de permisos actualizados
  //         updatedPermissions.push({
  //           module: {
  //             id: moduleExist.id,
  //             cod: moduleExist.cod,
  //             name: moduleExist.name,
  //             description: moduleExist.description
  //           },
  //           permissions
  //         });

  //         // Remover el módulo del set de módulos actuales ya que está presente en la actualización
  //         currentModuleIds.delete(moduleId);
  //       }

  //       // Eliminar los módulos que ya no están en la lista de actualización
  //       for (const moduleId of currentModuleIds) {
  //         await prisma.modulePermissions.deleteMany({
  //           where: {
  //             rolId: roleId,
  //             moduleId: moduleId
  //           }
  //         });
  //       }

  //       return updatedPermissions;
  //     });
  //   } catch (error) {
  //     this.logger.error(`Error updating permissions to rol for id: ${roleId}`, error.stack);
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     handleException(error, 'Error updating permissions to rol');
  //   }
  // }

  /**
   * Agrupar los permisos por módulo
   * @param rolsDB Roles con permisos a agrupar
   * @returns Roles con permisos agrupados por módulo
   */
  private groupPermissionsByModules(rolsDB: any[]): any[] {
    return rolsDB.map((rol) => {
      // Crear un mapa para almacenar módulos con sus permisos
      const modulesMap = new Map<string, { module; permissions }>();

      // Recorrer los permisos del rol
      rol.rolModulePermissions.forEach((rolPermission: any) => {
        const moduleId = rolPermission.modulePermissions.module.id;

        // Verificar si el módulo ya existe en el mapa
        if (!modulesMap.has(moduleId)) {
          // Si no existe, agregarlo al mapa con una lista de permisos vacía
          modulesMap.set(moduleId, {
            module: {
              id: rolPermission.module.id,
              cod: rolPermission.module.cod,
              name: rolPermission.module.name,
              description: rolPermission.module.description
            },
            permissions: []
          });
        }

        // Agregar el permiso al módulo correspondiente
        modulesMap.get(moduleId)?.permissions.push(rolPermission.permission);
      });

      // Convertir el mapa en una lista de módulos con permisos
      const modulePermissions = Array.from(modulesMap.values());

      return {
        id: rol.id,
        name: rol.name,
        description: rol.description,
        modulePermissions: modulePermissions
      };
    });
  }
}
