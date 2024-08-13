import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto';
import { User as UserInterface } from './interfaces/user.interface';
import { handleException } from 'src/utils';
import { RoleService } from '../role/role.service';
import { User } from '@prisma/client';
import { generate } from 'generate-password';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rol: RoleService
  ) {}

  async create(createUserDto: CreateUserDto, user: UserInterface): Promise<UserInterface> {
    try {
      const [newUser, rol] = await this.prisma.$transaction(async (prisma) => {
        const { rolId, email, password, ...dataUser } = createUserDto;

        // Verificamos si el email ya existe
        await this.checkEmailExists(email);

        // Buscamos el rol
        await this.rol.findById(rolId);

        // Encriptamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creamos el usuario
        const newUser = await prisma.user.create({
          data: {
            email,
            ...dataUser,
            password: hashedPassword,
            createdBy: user.id,
            updatedBy: user.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        // Creamos la asignacion de un rol a un usuario
        await prisma.userRol.create({
          data: {
            userId: newUser.id,
            rolId,
            createdBy: user.id,
            updatedBy: user.id
          }
        });

        return [newUser, rolId];
      });

      if (!user) {
        throw new BadRequestException('User not created');
      }

      return { ...newUser, rol };
    } catch (error) {
      this.logger.error(`Error creating a user for email: ${createUserDto.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a user');
    }
  }

  async update(
    id: string,
    createUserDto: CreateUserDto,
    user: UserInterface
  ): Promise<UserInterface> {
    try {
      const [newUser, rol] = await this.prisma.$transaction(async (prisma) => {
        const { rolId, email, password, ...dataUser } = createUserDto;

        // Buscamos el usuario
        const userDB = await prisma.user.findUnique({
          where: { id }
        });

        if (!userDB) {
          throw new NotFoundException('User not found');
        }

        // Verificamos si el email ya existe
        if (userDB.email !== email) {
          await this.checkEmailExists(email);
        }

        // Buscamos el rol
        await this.rol.findById(rolId);

        // Encriptamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizamos el usuario
        const newUser = await prisma.user.update({
          where: { id },
          data: {
            email,
            ...dataUser,
            password: hashedPassword,
            updatedBy: user.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        // Actualizamos la asignacion de un rol a un usuario
        await prisma.userRol.updateMany({
          where: {
            userId: newUser.id
          },
          data: {
            rolId,
            updatedBy: user.id
          }
        });

        return [newUser, rolId];
      });

      if (!newUser) {
        throw new BadRequestException('User not updated');
      }

      return { ...newUser, rol };
    } catch (error) {
      this.logger.error(`Error updating a user for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error updating a user');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date()
      }
    });
  }

  async findByEmail(email: string): Promise<User> {
    const clientDB = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!clientDB) {
      throw new NotFoundException('Email not found');
    }

    return clientDB;
  }

  async checkEmailExists(email: string): Promise<void> {
    const clientDB = await this.prisma.user.findUnique({
      where: { email }
    });
    if (clientDB) {
      throw new BadRequestException('Email already exists');
    }
  }

  async findById(id: string): Promise<UserInterface> {
    const clientDB = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        lastLogin: true,
        isActive: true,
        userRols: {
          select: {
            rolId: true
          }
        }
      }
    });
    if (!clientDB) {
      throw new NotFoundException('User not found');
    }
    return clientDB;
  }

  async findAll(): Promise<UserInterface[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        lastLogin: true,
        isActive: true,
        userRols: {
          select: {
            rolId: true
          }
        }
      }
    });
  }

  async findUserRoles(userId: string) {
    const userRolDB = await this.prisma.userRol.findMany({
      where: {
        userId
      },
      select: {
        rol: {
          select: {
            name: true
          }
        }
      }
    });

    if (!userRolDB) {
      throw new BadRequestException('User roles not found');
    }

    return userRolDB;
  }

  async createUserRol(userId: string, rolId: string, user: UserInterface) {
    const userRolDB = await this.prisma.userRol.create({
      data: {
        userId,
        rolId,
        createdBy: user.id,
        updatedBy: user.id
      }
    });

    if (!userRolDB) {
      throw new BadRequestException('User roles not created');
    }

    return userRolDB;
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newPassword = bcrypt.hashSync(password, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: newPassword
        }
      });
    } catch (error) {
      this.logger.error(`Error updating password for user: ${userId}`, error.stack);
      handleException(error, 'Error updating password');
    }
  }

  async updateMustChangePassword(userId: string, mustChangePassword: boolean): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mustChangePassword
        }
      });
    } catch (error) {
      this.logger.error(`Error updating must change password for user: ${userId}`, error.stack);
      handleException(error, 'Error updating must change password');
    }
  }

  generatePassword(): string {
    const password = generate({
      length: 10,
      numbers: true
    });

    return password;
  }
}
