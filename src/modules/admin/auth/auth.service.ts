import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/types/user.type';
import { handleException } from 'src/utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly userService: UsersService) {}

  async login(loginAuthDto: LoginAuthDto): Promise<User> {
    try {
      const { email, password } = loginAuthDto;

      // Buscamos el usuario por email
      const user = await this.userService.findByEmail(email);

      // Comparamos la contraseña ingresada con la contraseña encriptada
      if (!bcrypt.compareSync(password, user.password)) {
        throw new UnauthorizedException('password incorrect');
      }

      // TODO: Implement JWT
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      };
    } catch (error) {
      this.logger.error(`error logging in for email: ${loginAuthDto.email}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'error logging in');
    }
  }
}
