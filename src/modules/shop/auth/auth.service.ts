import {
  Injectable,
  Logger,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException
} from '@nestjs/common';
import { HttpResponse } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ClientData, ClientGoogleData } from 'src/interfaces/client.interface';
import { handleException } from 'src/utils';
import { LoginAuthClientDto } from './dto/login-auth-client.dto';
import * as bcrypt from 'bcrypt';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientService } from '../client/client.service';
import { ForgotPasswordClientDto } from './dto/forgot-password-client.dto';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordClientDto } from './dto/reset-password-client.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly clientService: ClientService,
    private readonly eventEmitter: TypedEventEmitter,
    private readonly configService: ConfigService
  ) {}

  /**
   * Genera un token JWT
   * @param payload Payload para generar el token
   * @returns Token generado
   */
  private getJwtToken(payload: { id: string }): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Login de un cliente con cuenta de Google
   * @param client Datos del cliente de Google
   * @returns Cliente autenticado
   */
  async validateUserGoogle(client: ClientGoogleData, res: Response): Promise<void> {
    try {
      // Buscar cliente en la base de datos por correo electrónico
      let clientDB = await this.prisma.client.findUnique({
        where: {
          email: client.email,
          isGoogleAuth: true
        }
      });
      // Verificamos si el email ya existe y esta inactivo
      const inactiveEmail = await this.clientService.checkEmailInactive(client.email);

      if (inactiveEmail) {
        throw new BadRequestException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already exists, but is inactive',
          data: {
            id: (await this.clientService.findByEmailInactive(client.email)).id
          }
        });
      }

      // Si no existe, crear un nuevo cliente
      if (!clientDB) {
        this.logger.log(`Creando nuevo cliente: ${client.name} (${client.email})`);
        clientDB = await this.prisma.client.create({
          data: {
            name: client.name,
            email: client.email,
            isGoogleAuth: true,
            token: client.token
          }
        });
      } else {
        await this.clientService.updateLastLogin(clientDB.id);
        if (clientDB.token !== client.token) {
          await this.clientService.updateToken(clientDB.id, client.token);
        }
      }

      // Generar el token JWT usando el id del usuario
      const token = this.jwtService.sign({ id: clientDB.id });

      // Configura la cookie HttpOnly
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 días
      });

      /*       // Retornar la respuesta con los datos del usuario
      res.json({
        id: clientDB.id,
        name: clientDB.name,
        email: clientDB.email
      }); */
      res.redirect(this.configService.get<string>('WEB_URL'));
    } catch (error) {
      this.logger.error('Error validating user', error.stack);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Client not found or could not be created');
      }
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Unauthorized access');
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException('Access is forbidden');
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  /**
   * Iniciar sesión de un cliente sin cuenta de google
   * @param loginAuthClientDto Datos para iniciar sesión
   * @returns Cliente autenticado
   */
  async login(loginAuthClientDto: LoginAuthClientDto, res: Response): Promise<void> {
    try {
      const { email, password } = loginAuthClientDto;

      // Verificamos si el email ya existe con Google Auth
      await this.clientService.findByEmailRegisteredGoogle(email);
      // Buscamos el usuario por email
      const clientDB = await this.clientService.findByEmail(email);

      if (!clientDB) {
        throw new NotFoundException('Client not registered');
      }

      // Comparamos la contraseña ingresada con la contraseña encriptada
      if (!bcrypt.compareSync(password, clientDB.password)) {
        throw new UnauthorizedException('Password incorrect');
      }
      await this.clientService.updateLastLogin(clientDB.id);

      const token = this.getJwtToken({ id: clientDB.id });

      // Configura la cookie HttpOnly
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 días
      });

      res.json({
        id: clientDB.id,
        name: clientDB.name,
        email: clientDB.email
      });
    } catch (error) {
      this.logger.error(`Error logging in for email: ${loginAuthClientDto.email}`, error.stack);
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
   * Crear un nuevo cliente
   * @param createClientDto Datos para crear un cliente
   * @returns Cliente creado
   */
  async create(createClientDto: CreateClientDto): Promise<HttpResponse<ClientData>> {
    try {
      const newClient = await this.prisma.$transaction(async (prisma) => {
        const { email, password, ...dataClient } = createClientDto;

        const existEmailGoogle = await this.clientService.findByEmailRegisteredGoogle(email);
        if (existEmailGoogle) {
          throw new BadRequestException('Email already exists with Google Auth');
        }

        // Verificamos si el email ya existe y este activo
        const existEmail = await this.clientService.checkEmailExist(email);

        if (existEmail) {
          throw new BadRequestException('Email already exists');
        }

        // Verificamos si el email ya existe y esta inactivo
        const inactiveEmail = await this.clientService.checkEmailInactive(email);

        if (inactiveEmail) {
          throw new BadRequestException({
            statusCode: HttpStatus.CONFLICT,
            message: 'Email already exists, but is inactive',
            data: {
              id: (await this.clientService.findByEmailInactive(email)).id
            }
          });
        }

        // Encriptamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creamos el usuario
        const newClient = await prisma.client.create({
          data: {
            email,
            ...dataClient,
            password: hashedPassword,
            isGoogleAuth: false
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        if (!newClient) {
          throw new Error('Failed to create new client');
        }

        return {
          ...newClient
        };
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Client created',
        data: {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email
        }
      };
    } catch (error) {
      this.logger.error(`Error creating a user for email: ${createClientDto.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a user');
    }
  }

  /**
   * Enviar un correo electrónico para restablecer la contraseña
   * @param forgotPasswordClientDto Datos para restablecer la contraseña
   * @returns Email enviado
   */
  async forgotPassword(
    forgotPasswordClientDto: ForgotPasswordClientDto
  ): Promise<HttpResponse<string>> {
    try {
      const { email } = forgotPasswordClientDto;
      const clientDB = await this.clientService.findByEmailInformation(email);
      // Generar el token JWT con expiración de 5 minutos
      const payload = { id: clientDB.id };
      const token = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_RESET_PASSWORD_EXPIRES_IN')
      });

      const link = `http://localhost:3000/api/v1/auth/client/reset-password?token=${token}`;

      const emailResponse = await this.eventEmitter.emitAsync('client.forgot-password', {
        name: clientDB.name.toUpperCase(),
        email,
        link
      });

      if (emailResponse.every((response) => response === true)) {
        return {
          statusCode: HttpStatus.OK,
          message: `Email sent successfully`,
          data: forgotPasswordClientDto.email
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Failed to send email`,
          data: forgotPasswordClientDto.email
        };
      }
    } catch (error) {
      this.logger.error(`Error sending email to: ${forgotPasswordClientDto.email}`, error.stack);
      handleException(error, 'Error sending email');
    }
  }

  /**
   * Restablecer la contraseña de un cliente
   * @param token Token para restablecer la contraseña
   * @param resetPasswordClientDto Datos para restablecer la contraseña
   * @returns Contraseña restablecida
   */
  async resetPassword(
    token: string,
    resetPasswordClientDto: ResetPasswordClientDto
  ): Promise<HttpResponse<string>> {
    try {
      const { password, confirmPassword } = resetPasswordClientDto;
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });

      const clientDB = await this.clientService.findById(payload.id);

      if (!clientDB) {
        throw new NotFoundException('Client not found');
      }

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.prisma.client.update({
        where: {
          id: clientDB.id
        },
        data: {
          password: hashedPassword
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Password reset successfully',
        data: `Password reset successfully for ${clientDB.email}`
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      } else {
        this.logger.error(`Error resetting password`, error.stack);
        throw new BadRequestException('Error resetting password');
      }
    }
  }

  /**
   * Cierra la sesión del cliente
   * @param res Respuesta HTTP
   */
  async logout(res: Response): Promise<void> {
    // Borra la cookie que contiene el token JWT
    res.cookie('access_token', '', {
      httpOnly: true,
      expires: new Date(0) // Establece la fecha de expiración a una fecha pasada para eliminar la cookie
    });

    // Enviar una respuesta de éxito
    res.status(200).json({ message: 'Logout successful' });
  }
}
