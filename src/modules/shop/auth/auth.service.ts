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
import {
  ClientData,
  ClientDataLogin,
  ClientGoogleData,
  ClientPayload
} from 'src/interfaces/client.interface';
import { handleException } from 'src/utils';
import { LoginAuthClientDto } from './dto/login-auth-client.dto';
import * as bcrypt from 'bcrypt';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
  async validateUser(client: ClientGoogleData): Promise<HttpResponse<ClientDataLogin>> {
    try {
      this.logger.log('AuthService: Validating user');
      this.logger.log(client);

      // Buscar cliente en la base de datos por correo electrónico
      let clientDB = await this.prisma.client.findUnique({
        where: {
          email: client.email,
          isGoogleAuth: true
        }
      });

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
   * Mostar un cliente por su id
   * @param id Id del cliente
   * @returns Cliente encontrado
   */
  async findById(id: string): Promise<ClientPayload> {
    try {
      const clientDB = await this.prisma.client.findUnique({
        where: { id, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          isGoogleAuth: true,
          lastLogin: true,
          isActive: true
        }
      });

      if (!clientDB) {
        throw new NotFoundException('Client not found');
      }
      return {
        id: clientDB.id,
        name: clientDB.name,
        email: clientDB.email,
        phone: clientDB.phone,
        birthDate: clientDB.birthDate,
        isGoogleAuth: clientDB.isGoogleAuth,
        isActive: clientDB.isActive,
        lastLogin: clientDB.lastLogin
      };
    } catch (error) {
      this.logger.error(`Error finding client for id: ${id}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'Error finding client');
    }
  }

  /**
   * Buscar un cliente por su email
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
  async findByEmail(email: string): Promise<
    ClientData & {
      password: string;
    }
  > {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });

    if (!clientDB) {
      throw new NotFoundException('Client not found');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email,
      password: clientDB.password
    };
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
      const clientDB = await this.findByEmail(email);

      if (!clientDB) {
        throw new NotFoundException('Client not registered');
      }

      // Comparamos la contraseña ingresada con la contraseña encriptada
      if (!bcrypt.compareSync(password, clientDB.password)) {
        throw new UnauthorizedException('Password incorrect');
      }

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

  async checkEmailExist(email: string): Promise<boolean> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: true
      }
    });

    return !!clientDB;
  }

  async checkEmailInactive(email: string): Promise<boolean> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: false
      }
    });

    return !!clientDB;
  }

  async findByEmailInactive(email: string): Promise<ClientData> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: false
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!clientDB) {
      throw new NotFoundException('Clirnt not found');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email
    };
  }

  async findByEmailRegisteredGoogle(email: string): Promise<boolean> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isGoogleAuth: true
      }
    });

    if (clientDB) {
      if (clientDB.isGoogleAuth && !clientDB.isActive) {
        throw new BadRequestException('This client is registered with Google Auth but is inactive');
      }
      throw new BadRequestException('This client is registered with Google Auth');
    }

    return !!clientDB;
  }

  async create(createClientDto: CreateClientDto): Promise<HttpResponse<ClientData>> {
    try {
      const newClient = await this.prisma.$transaction(async (prisma) => {
        const { email, password, ...dataClient } = createClientDto;

        const existEmailGoogle = await this.findByEmailRegisteredGoogle(email);
        if (existEmailGoogle) {
          throw new BadRequestException('Email already exists with Google Auth');
        }

        // Verificamos si el email ya existe y este activo
        const existEmail = await this.checkEmailExist(email);

        if (existEmail) {
          throw new BadRequestException('Email already exists');
        }

        // Verificamos si el email ya existe y esta inactivo
        const inactiveEmail = await this.checkEmailInactive(email);

        if (inactiveEmail) {
          throw new BadRequestException({
            statusCode: HttpStatus.CONFLICT,
            message: 'Email already exists',
            data: {
              id: (await this.findByEmailInactive(email)).id
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

      if (!newClient) {
        throw new Error('Transaction failed, newClient is null');
      }

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
