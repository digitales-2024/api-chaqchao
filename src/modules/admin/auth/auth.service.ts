import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { LoginAuthDto } from './dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/interfaces/user.interface';
import { handleException } from 'src/utils';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RolService } from '../rol/rol.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly rolService: RolService,
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

      // Indicar que el usuario debe cambiar la contraseña si es la primera vez que inicia sesión
      await this.validateUser(email, password);

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

  async updatePassword(updatePasswordDto: UpdatePasswordDto): Promise<User> {
    try {
      const { email, password, newPassword, confirmPassword } = updatePasswordDto;

      const user = await this.userService.findByEmail(email);

      if (!user.mustChangePassword) {
        throw new ForbiddenException('You do not need to change your password');
      }

      const isPasswordMatching = await bcrypt.compare(password, user.password);

      if (!isPasswordMatching) {
        throw new UnauthorizedException('Password current do not match');
      }

      if (newPassword === password) {
        throw new ForbiddenException('The new password must be different from the current one');
      }

      if (newPassword !== confirmPassword) {
        throw new ForbiddenException('Passwords do not match');
      }

      await this.userService.updatePassword(user.id, newPassword);

      await this.userService.updateMustChangePassword(user.id, false);

      const rol = await this.getRol(user);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: this.getJwtToken({ id: user.id }),
        rol: rol.id
      };
    } catch (error) {
      this.logger.error('Error updating password', error.stack);
      handleException(error, 'Error updating password');
    }
  }

  private async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email do not match');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Password do not match');
    }

    if (user.mustChangePassword) {
      throw new ForbiddenException('You must change your password');
    }

    return user;
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private getRol(user: User) {
    return this.rolService.findUserRol(user.id);
  }
}
