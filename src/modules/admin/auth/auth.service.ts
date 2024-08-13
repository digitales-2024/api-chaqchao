import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/interfaces/user.interface';
import { handleException } from 'src/utils';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '../role/role.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly rolService: RoleService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginAuthDto: LoginAuthDto): Promise<User> {
    try {
      const { email, password } = loginAuthDto;

      // Buscamos el usuario por email
      const user = await this.userService.findByEmail(email);

      // Comparamos la contraseña ingresada con la contraseña encriptada
      if (!bcrypt.compareSync(password, user.password)) {
        throw new UnauthorizedException('Password incorrect');
      }

      // Obtenemos el rol del usuario
      const rol = await this.getRol(user);

      // Actualizamos el ultimo login del usuario
      await this.userService.updateLastLogin(user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: this.getJwtToken({ id: user.id }),
        rol: rol.id
      };
    } catch (error) {
      this.logger.error(`Error logging in for email: ${loginAuthDto.email}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'Error logging in');
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private getRol(user: User) {
    return this.rolService.findUserRol(user.id);
  }
}
