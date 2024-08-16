import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './users/interfaces/user.interface';
import { UpdatePasswordDto } from './auth/dto/update-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  getProfile(user: User) {
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

  async updatePassword(updatePassword: UpdatePasswordDto, user: User) {
    const { email } = user;

    console.log(user);

    const { password, newPassword, confirmPassword } = updatePassword;

    const userDB = await this.prismaService.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      }
    });

    const isMatching = await bcrypt.compare(password, userDB.password);

    if (!isMatching) {
      throw new BadRequestException('Password incorrect');
    }

    if (newPassword === password) {
      throw new BadRequestException('New password must be different from the current password');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: {
        id: userDB.id
      },
      data: {
        password: hashedPassword
      }
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully'
    };
  }
}
