import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';
import { handleException } from 'src/utils';
import { ValidRoles } from '../auth/interfaces';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(private readonly prisma: PrismaService) {}

  async ensureAdminUser(): Promise<void> {
    const adminRole = await this.prisma.rol.findUnique({
      where: {
        name_isActive: {
          name: ValidRoles.ADMIN,
          isActive: true
        }
      }
    });

    if (!adminRole) {
      await this.create(
        {
          name: ValidRoles.ADMIN,
          description: 'Administrator'
        },
        { id: 'admin' } as User
      );
    }
  }

  async create(createRoleDto: CreateRoleDto, user: User): Promise<CreateRoleDto> {
    try {
      const { name } = createRoleDto;

      await this.checkExitByName(name);

      const newRol = await this.prisma.rol.create({
        data: { ...createRoleDto, createdBy: user.id, updatedBy: user.id },
        select: { id: true, name: true, description: true }
      });

      return newRol;
    } catch (error) {
      this.logger.error(`Error creating a role for name: ${createRoleDto.name}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a role');
    }
  }

  async checkExitByName(name: string) {
    const roleDB = await this.prisma.rol.findUnique({
      where: {
        name_isActive: {
          name,
          isActive: true
        }
      }
    });

    if (roleDB) {
      throw new BadRequestException('Role already exists');
    }
  }

  async findAll() {
    return this.prisma.rol.findMany({
      where: {
        isActive: true
      }
    });
  }

  async findById(id: string) {
    const rolDB = await this.prisma.rol.findUnique({
      where: {
        id,
        isActive: true
      }
    });

    if (!rolDB) {
      throw new BadRequestException('Role not found');
    }

    return rolDB;
  }

  async update(id: string, createRoleDto: CreateRoleDto, user: User) {
    const roleDB = await this.findById(id);

    if (!roleDB) {
      throw new BadRequestException('Role not found');
    }

    return this.prisma.rol.update({
      where: {
        id
      },
      data: {
        ...createRoleDto,
        updatedBy: user.id
      }
    });
  }

  async remove(id: string) {
    const roleDB = await this.findById(id);

    if (!roleDB) {
      throw new BadRequestException('Role not found');
    }

    return this.prisma.rol.update({
      where: {
        id
      },
      data: {
        isActive: false
      }
    });
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
      throw new BadRequestException('User roles not found');
    }

    return userRolDB.rol;
  }

  async isRolSuperAdmin(rolId: string): Promise<void> {
    const userRolDB = await this.prisma.rol.findFirst({
      where: {
        id: rolId
      },
      select: {
        name: true
      }
    });

    if (!userRolDB) throw new BadRequestException('User roles not found');

    if (userRolDB.name === ValidRoles.SUPER_ADMIN)
      throw new BadRequestException('User role is superadmin');
  }
}
