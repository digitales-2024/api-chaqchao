import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto';
import { User as UserInterface } from './interfaces/user.interface';
import { User } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, user: UserInterface): Promise<UserInterface> {
    try {
      const { email, password } = createUserDto;
      await this.checkEmailExists(email);
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
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
      return newUser;
    } catch (error) {
      this.logger.error(`Error creating a user for email: ${createUserDto.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a user');
    }
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
        isActive: true
      }
    });
    if (!clientDB) {
      throw new NotFoundException('User not found');
    }
    return clientDB;
  }
}
