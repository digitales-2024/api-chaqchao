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
import { handleException } from 'src/utils';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RolService } from '../rol/rol.service';
import { UserDataLogin } from 'src/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly rolService: RolService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginAuthDto: LoginAuthDto): Promise<UserDataLogin> {
    try {
      const { email, password } = loginAuthDto;

      // Buscamos el usuario por email
      const userDB = await this.userService.findByEmail(email);

      if (!userDB) {
        throw new NotFoundException('User not registered');
      }

      // Comparamos la contraseña ingresada con la contraseña encriptada
      if (!bcrypt.compareSync(password, userDB.password)) {
        throw new UnauthorizedException('Password incorrect');
      }

      // Actualizamos el ultimo login del usuario
      await this.userService.updateLastLogin(userDB.id);

      // Indicar que el usuario debe cambiar la contraseña si es la primera vez que inicia sesión
      if (userDB.mustChangePassword) {
        throw new ForbiddenException('You must change your password');
      }

      return {
        id: userDB.id,
        name: userDB.name,
        email: userDB.email,
        phone: userDB.phone,
        roles: userDB.roles,
        token: this.getJwtToken({ id: userDB.id })
      };
    } catch (error) {
      this.logger.error(`Error logging in for email: ${loginAuthDto.email}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      handleException(error, 'Error logging in');
    }
  }

  /**
   * Actualiza la contraseña temporal del usuario
   * @param updatePasswordDto Datos para actualizar la contraseña
   * @returns Datos del usuario logueado
   */
  async updatePasswordTemp(updatePasswordDto: UpdatePasswordDto): Promise<UserDataLogin> {
    try {
      const { email, password, newPassword, confirmPassword } = updatePasswordDto;

      const userDB = await this.userService.findByEmail(email);

      if (!userDB.mustChangePassword) {
        throw new ForbiddenException('You do not need to change your password');
      }

      const isPasswordMatching = await bcrypt.compare(password, userDB.password);

      if (!isPasswordMatching) {
        throw new UnauthorizedException('Password current do not match');
      }

      if (newPassword === password) {
        throw new ForbiddenException('The new password must be different from the current one');
      }

      if (newPassword !== confirmPassword) {
        throw new ForbiddenException('Passwords do not match');
      }

      await this.userService.updatePasswordTemp(userDB.id, updatePasswordDto);

      return {
        id: userDB.id,
        name: userDB.name,
        email: userDB.email,
        phone: userDB.phone,
        roles: userDB.roles,
        token: this.getJwtToken({ id: userDB.id })
      };
    } catch (error) {
      this.logger.error('Error updating password', error.stack);
      handleException(error, 'Error updating password');
    }
  }

  /**
   * Genera un token JWT
   * @param payload Payload para generar el token
   * @returns  Token generado
   */
  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
