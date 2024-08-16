import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';
import { handleException } from 'src/utils';
import { ValidRols } from '../auth/interfaces';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  private readonly logger = new Logger(RolService.name);
  constructor(private readonly prisma: PrismaService) {}

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
        { id: 'admin' } as User
      );
    }
  }

  async create(createRolDto: CreateRolDto, user: User): Promise<CreateRolDto> {
    try {
      const { name } = createRolDto;

      await this.checkExitByName(name);

      const newRol = await this.prisma.rol.create({
        data: { ...createRolDto, createdBy: user.id, updatedBy: user.id },
        select: { id: true, name: true, description: true }
      });

      return newRol;
    } catch (error) {
      this.logger.error(`Error creating a rol for name: ${createRolDto.name}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a rol');
    }
  }

  async checkExitByName(name: string) {
    const rolDB = await this.prisma.rol.findUnique({
      where: {
        name_isActive: {
          name,
          isActive: true
        }
      }
    });

    if (rolDB) {
      throw new BadRequestException('Rol already exists');
    }
  }

  async findAll() {
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
  }

  async findById(id: string) {
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

    if (!rolDB) {
      throw new BadRequestException('Rol not found');
    }

    return rolDB;
  }

  async update(id: string, updateRolDto: UpdateRolDto, user: User) {
    const rolDB = await this.findById(id);

    if (!rolDB) {
      throw new BadRequestException('Rol not found');
    }

    return this.prisma.rol.update({
      where: {
        id
      },
      data: {
        ...updateRolDto,
        updatedBy: user.id
      }
    });
  }

  async remove(id: string) {
    await this.isRolSuperAdmin(id);

    await this.rolIsUsed(id);

    await this.findById(id);

    return this.prisma.rol.delete({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        description: true
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
      throw new BadRequestException('User rols not found');
    }

    return userRolDB.rol;
  }

  async isRolSuperAdmin(rolId: string): Promise<void> {
    const userRolDB = await this.prisma.rol.findUnique({
      where: {
        id: rolId
      },
      select: {
        name: true
      }
    });

    if (!userRolDB) throw new BadRequestException('User rols not found');

    if (userRolDB.name === ValidRols.SUPER_ADMIN) {
      throw new BadRequestException('User rol is superadmin');
    }
  }

  async rolIsUsed(rolId: string) {
    const userRolDB = await this.prisma.userRol.findFirst({
      where: {
        rolId,
        isActive: true
      }
    });

    if (userRolDB) {
      throw new BadRequestException('Rol is used');
    }
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
}
