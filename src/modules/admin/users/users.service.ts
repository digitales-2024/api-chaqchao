import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto';
import { User as UserCreate } from './types/user.type';
import { User } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserCreate> {
    try {
      const { email, password } = createUserDto;
      await this.checkEmailExists(email);
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword
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
      handleException(error, 'error creating a user');
    }
  }

  async findByEmail(email: string): Promise<User> {
    const clientDB = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!clientDB) {
      throw new NotFoundException('email not found');
    }
    return clientDB;
  }

  async checkEmailExists(email: string): Promise<void> {
    const clientDB = await this.prisma.user.findUnique({
      where: { email }
    });
    if (clientDB) {
      throw new BadRequestException('email already exists');
    }
  }
}
