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
import { HttpResponse, RolPermissions, RolModulesPermissions, Rol } from 'src/interfaces';

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
  async create(createRolDto: CreateRolDto): Promise<HttpResponse<Rol>> {
    try {
      const { name, description, modulePermissions } = createRolDto;

      // Verificar si el rol ya existe y está activo
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
      const newRol = await this.prisma.$transaction(async (prisma) => {
        // Crear el rol
        const createdRol = await prisma.rol.create({
          data: {
            name,
            description
          },
          select: { id: true, name: true, description: true }
        });

        // Verificar existencia de permisos y construir las entradas para RolModulePermissions
        const rolModulePermissionEntries = [];
        for (const modulePermissionId of modulePermissions) {
          const modulePermission = await prisma.modulePermissions.findUnique({
            where: {
              id: modulePermissionId
            }
          });

          if (!modulePermission) {
            throw new BadRequestException(
              `ModulePermission with ID ${modulePermissionId} does not exist.`
            );
          }

          rolModulePermissionEntries.push({
            rolId: createdRol.id,
            modulePermissionsId: modulePermissionId
          });
        }

        // Crear las relaciones entre rol y permisos en una transacción
        await prisma.rolModulePermissions.createMany({
          data: rolModulePermissionEntries,
          skipDuplicates: true
        });

        return createdRol;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Role created successfully',
        data: newRol
      };
    } catch (error) {
      this.logger.error(`Error creating a role with name: ${createRolDto.name}`, error.stack);

      if (error instanceof ConflictException || BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating role. Please try again.');
    }
  }

  /**
   * Actualiza un rol existente en la base de datos por su id.
   * @param id Id del rol a actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @returns Datos del rol actualizado
   */
  async update(id: string, updateRolDto: UpdateRolDto): Promise<HttpResponse<RolPermissions>> {
    try {
      const { name, description, modulePermissions } = updateRolDto;

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
        throw new BadRequestException('Role name cannot be SUPER_ADMIN');
      }

      // Verificar si el nombre ya existe
      if (name) {
        const existingRole = await this.findByName(name);
        if (existingRole) {
          const { id: existingRoleId } = existingRole;
          if (existingRoleId !== id) {
            throw new ConflictException('Role already exists with this name');
          }
        }
      }

      // Buscar el rol en la base de datos
      const roleInDb = await this.findById(id);
      if (!roleInDb) {
        throw new NotFoundException('Role not found');
      }
      // Iniciar una transacción para actualizar el rol y sus permisos
      const updatedRole: RolPermissions = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el rol con los nuevos datos
        const updatedRoleData = await prisma.rol.update({
          where: { id },
          data: {
            name,
            description
          },
          select: {
            id: true,
            name: true,
            description: true
          }
        });

        // Eliminar permisos antiguos del rol
        await prisma.rolModulePermissions.deleteMany({
          where: { rolId: id }
        });

        // Validar existencia de permisos y construir nuevas entradas
        const rolModulePermissionEntries = [];
        if (modulePermissions && modulePermissions.length > 0) {
          for (const modulePermissionId of modulePermissions) {
            const modulePermission = await prisma.modulePermissions.findUnique({
              where: {
                id: modulePermissionId
              },
              select: {
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
            });

            if (!modulePermission) {
              throw new BadRequestException(
                `ModulePermission with ID ${modulePermissionId} does not exist.`
              );
            }

            rolModulePermissionEntries.push({
              rolId: id,
              modulePermissionsId: modulePermissionId
            });
          }

          // Crear nuevas relaciones entre rol y permisos
          await prisma.rolModulePermissions.createMany({
            data: rolModulePermissionEntries,
            skipDuplicates: true
          });
        }

        // Devolver datos actualizados del rol
        const rolPermissions = await prisma.rolModulePermissions.findMany({
          where: { rolId: id },
          select: {
            modulePermissions: {
              select: {
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
        });

        // Agrupar permisos por módulo
        const groupedByModule = rolPermissions.reduce((acc, rolModulePermission) => {
          const moduleId = rolModulePermission.modulePermissions.module.id;
          const module = rolModulePermission.modulePermissions.module;
          const permission = rolModulePermission.modulePermissions.permission;

          if (!acc[moduleId]) {
            acc[moduleId] = {
              module,
              permissions: []
            };
          }

          acc[moduleId].permissions.push(permission);

          return acc;
        }, {} as RolModulesPermissions[]);
        return {
          ...updatedRoleData,
          rolPermissions: groupedByModule
        };
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
      handleException(error, 'Error updating role');
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
      const removedRol = await this.prisma.$transaction(async (prisma) => {
        // Eliminar el rol, y las relaciones en RolModulePermissions se eliminarán automáticamente por la cascada
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
          rolPermissions: rolDelete.rolModulePermissions.map((rolModulePermission) => ({
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
        data: removedRol
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
  async findAll(): Promise<any[]> {
    try {
      // Recupera todos los roles activos con sus permisos asociados
      const roles = await this.prisma.rol.findMany({
        where: {
          isActive: true,
          NOT: {
            name: ValidRols.SUPER_ADMIN
          }
        },
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
          rolPermissions: Array.from(modulesMap.values())
        };
      });

      return groupedRoles;
    } catch (error) {
      this.logger.error('Error getting roles with modules and permissions', error.stack);
      throw new Error('Error getting roles with modules and permissions');
    }
  }

  /**
   * Encuentra un rol por su id y devuelve los datos del rol con módulos y permisos
   * @param id Id del rol a buscar
   * @returns Datos del rol encontrado con módulos y permisos agrupados
   */
  async findById(id: string): Promise<RolPermissions> {
    try {
      // Buscar el rol por ID en la base de datos, incluyendo módulos y permisos
      const role = await this.prisma.rol.findUnique({
        where: { id },
        include: {
          rolModulePermissions: {
            include: {
              modulePermissions: {
                include: {
                  module: true, // Incluye el módulo relacionado
                  permission: true // Incluye el permiso relacionado
                }
              }
            }
          }
        }
      });

      // Verificar si el rol existe
      if (!role) {
        throw new NotFoundException(`Role not found`);
      }

      // Agrupar permisos por módulos
      const modulesMap = new Map<string, { module: any; permissions: any[] }>();

      role.rolModulePermissions.forEach((rolModulePermission) => {
        const moduleId = rolModulePermission.modulePermissions.module.id;

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

        modulesMap.get(moduleId)?.permissions.push({
          id: rolModulePermission.modulePermissions.permission.id,
          cod: rolModulePermission.modulePermissions.permission.cod,
          name: rolModulePermission.modulePermissions.permission.name,
          description: rolModulePermission.modulePermissions.permission.description
        });
      });

      // Estructurar la respuesta final con rol, módulos y permisos
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        rolPermissions: Array.from(modulesMap.values())
      };
    } catch (error) {
      // Manejo del error en caso de que ocurra una excepción durante la búsqueda
      this.logger.error(`Error finding role with id: ${id}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Error finding role. Please try again.');
    }
  }

  /**
   * Verificar si no hay datos para actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @returns  True si no hay datos para actualizar, false en caso contrario
   */
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
   * Encuentra un rol por su nombre.
   * @param name Nombre del rol a buscar.
   * @returns Rol encontrado o null si no existe.
   */
  async findByName(name: string): Promise<Rol | null> {
    try {
      return await this.prisma.rol.findUnique({
        where: {
          name_isActive: {
            name,
            isActive: true // Si el rol debe estar activo para ser considerado
          }
        }
      });
    } catch (error) {
      // Manejo de errores si es necesario
      this.logger.error(`Error finding role by name: ${name}`, error.stack);
      throw new BadRequestException('Error finding role by name');
    }
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
}
