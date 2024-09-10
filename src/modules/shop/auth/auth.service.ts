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
import { ClientData, ClientDataLogin, ClientGoogleData } from 'src/interfaces/client.interface';
import { handleException } from 'src/utils';
import { LoginAuthClientDto } from './dto/login-auth-client.dto';
import * as bcrypt from 'bcrypt';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientService } from '../client/client.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly clientService: ClientService
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
  async validateUserGoogle(client: ClientGoogleData): Promise<HttpResponse<ClientDataLogin>> {
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
      const token = this.getJwtToken({ id: clientDB.id });

      // Retornar la respuesta con los datos del usuario y el token
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User authenticated successfully',
        data: {
          id: clientDB.id,
          name: clientDB.name,
          email: clientDB.email,
          token: token
        }
      };
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
  async login(loginAuthClientDto: LoginAuthClientDto): Promise<ClientDataLogin> {
    try {
      const { email, password } = loginAuthClientDto;

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

      return {
        id: clientDB.id,
        name: clientDB.name,
        email: clientDB.email,
        token: this.getJwtToken({ id: clientDB.id })
      };
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
}
