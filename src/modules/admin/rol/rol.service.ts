import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';
import { handleException } from 'src/utils';
import { ValidRols } from '../auth/interfaces';

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
      throw new BadRequestException('Rol not found');
    }

    return rolDB;
  }

  async update(id: string, createRolDto: CreateRolDto, user: User) {
    const rolDB = await this.findById(id);

    if (!rolDB) {
      throw new BadRequestException('Rol not found');
    }

    return this.prisma.rol.update({
      where: {
        id
      },
      data: {
        ...createRolDto,
        updatedBy: user.id
      }
    });
  }

  async remove(id: string) {
    const rolDB = await this.findById(id);

    if (!rolDB) {
      throw new BadRequestException('Rol not found');
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
      throw new BadRequestException('User rols not found');
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

    if (!userRolDB) throw new BadRequestException('User rols not found');

    if (userRolDB.name === ValidRols.SUPER_ADMIN)
      throw new BadRequestException('User rol is superadmin');
  }
}
