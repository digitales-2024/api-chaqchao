import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User as UserInterface } from './interfaces/user.interface';
import { handleException } from 'src/utils';
import { RolService } from '../rol/rol.service';
import { User } from '@prisma/client';
import { generate } from 'generate-password';
import { HttpsSucess } from 'src/interfaces';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rol: RolService,
    private readonly eventEmitter: TypedEventEmitter
  ) {}

  async create(createUserDto: CreateUserDto, user: UserInterface): Promise<UserInterface> {
    try {
      const [newUser, rol] = await this.prisma.$transaction(async (prisma) => {
        const { rol, email, password, ...dataUser } = createUserDto;

        // Verificar que no se pueda crear un usuario con el rol superadmin
        await this.rol.isRolSuperAdmin(rol);

        // Verificamos si el email ya existe
        await this.checkEmailExists(email);

        // Buscamos el rol
        await this.rol.findById(rol);

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
            rolId: rol,
            createdBy: user.id,
            updatedBy: user.id
          }
        });

        return [newUser, rol];
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
    updateUserDto: UpdateUserDto,
    id: string,
    user: UserInterface
  ): Promise<UserInterface> {
    try {
      const [userUpdate, rol] = await this.prisma.$transaction(async (prisma) => {
        const { rol, ...dataUser } = updateUserDto;

        await this.findById(id);

        // Verificar que no se pueda actualizar un usuario con el rol superadmin
        await this.rol.isRolSuperAdmin(rol);

        // Buscamos el rol
        await this.rol.findById(rol);

        // Creamos el usuario
        const updateUser = await prisma.user.update({
          where: { id },
          data: {
            ...dataUser,
            updatedBy: user.id,
            updatedAt: new Date()
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        // Creamos la asignacion de un rol a un usuario
        await prisma.userRol.update({
          where: {
            userId_rolId_isActive: {
              userId: id,
              rolId: rol,
              isActive: true
            }
          },
          data: {
            rolId: rol,
            updatedBy: user.id,
            updatedAt: new Date()
          }
        });

        return [updateUser, rol];
      });

      return { ...userUpdate, rol };
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

    if (clientDB) {
      throw new BadRequestException('Email already exists');
    }

    if (clientDB?.isActive === false) {
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
    return { ...clientDB, rol: clientDB.userRols[0].rolId };
  }

  async findAll(): Promise<UserInterface[]> {
    const usersDB = await this.prisma.user.findMany({
      where: {
        isActive: true
      },
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

    return usersDB.map((user) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        rol: user.userRols[0].rolId
      };
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

  async profile(user: UserInterface): Promise<UserInterface> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      rol: user.rol
    };
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<HttpsSucess> {
    try {
      const { email, name } = sendEmailDto;

      const userDB = await this.findByEmail(email);

      console.log(userDB);

      if (userDB.mustChangePassword) {
        const password = this.generatePassword();

        await this.updatePassword(userDB.id, password);

        this.eventEmitter.emit('user.welcome-admin-first', {
          name: name.toUpperCase(),
          email: email,
          password: password
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Email sent',
        data: email
      };
    } catch (error) {
      this.logger.error(`Error sending email to: ${sendEmailDto.email}`, error.stack);
      handleException(error, 'Error sending email');
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
