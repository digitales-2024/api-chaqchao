import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto';
import { User as UserInterface } from './interfaces/user.interface';
import { handleException } from 'src/utils';
import { RolService } from '../rol/rol.service';
import { User } from '@prisma/client';
import { generate } from 'generate-password';
import { HttpsSucess } from 'src/interfaces';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rol: RolService
  ) {}

  async create(createUserDto: CreateUserDto, user: UserInterface): Promise<UserInterface> {
    try {
      const [newUser, rol] = await this.prisma.$transaction(async (prisma) => {
        const { rolId, email, password, ...dataUser } = createUserDto;

        // Verificar que no se pueda crear un usuario con el rol superadmin
        await this.rol.isRolSuperAdmin(rolId);

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

  async remove(user: UserInterface, id: string): Promise<HttpsSucess> {
    try {
      const userRemove = await this.prisma.$transaction(async (prisma) => {
        const userDB = await this.findById(id);

        if (userDB.id === user.id) {
          throw new BadRequestException('You cannot delete yourself');
        }

        await prisma.user.update({
          where: { id },
          data: {
            isActive: false,
            updatedAt: new Date(),
            updatedBy: user.id
          }
        });

        const userRolDB = await prisma.userRol.findFirst({
          where: {
            userId: id
          }
        });

        if (!userRolDB) {
          throw new NotFoundException('User rol not found');
        }

        await prisma.userRol.update({
          where: {
            id: userRolDB.id
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
            updatedBy: user.id
          }
        });

        return userDB;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User deleted',
        data: userRemove.email
      };
    } catch (error) {
      this.logger.error(`Error deleting a user for id: ${id}`, error.stack);
      handleException(error, 'Error deleting a user');
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
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      }
    });

    if (!clientDB) {
      throw new NotFoundException('Email not found');
    }

    return clientDB;
  }

  async checkEmailExists(email: string): Promise<void> {
    const clientDB = await this.prisma.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      }
    });
    console.log(clientDB);

    if (clientDB) {
      throw new BadRequestException('Email already exists');
    }

    if (clientDB.isActive === false) {
      throw new BadRequestException('Email already exists but is inactive');
    }
  }

  async findById(id: string): Promise<UserInterface> {
    const clientDB = await this.prisma.user.findUnique({
      where: { id, isActive: true },
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

  async findUserRols(userId: string) {
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
      throw new BadRequestException('User rols not found');
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
      throw new BadRequestException('User rols not created');
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
