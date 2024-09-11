import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientData, ClientPayload } from 'src/interfaces';
import { handleException } from 'src/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return `This action returns all client`;
  }

  findOne(id: number) {
    return `This action returns a #${id} client`;
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return `This action updates a #${id} ${updateClientDto} client`;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
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
   * Buscar un cliente por su email
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
  async findByEmailInformation(email: string): Promise<ClientData> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        isGoogleAuth: true
      }
    });

    if (!clientDB) {
      throw new NotFoundException('Client not found');
    }
    if (clientDB.isGoogleAuth && clientDB) {
      throw new BadRequestException('This client is registered with Google Auth');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email
    };
  }

  /**
   * Verificar si el email ya esta registrado
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
  async checkEmailExist(email: string): Promise<boolean> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: true
      }
    });

    return !!clientDB;
  }

  /**
   * Verificar si el email ya esta registrado
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
  async checkEmailInactive(email: string): Promise<boolean> {
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email,
        isActive: false
      }
    });

    return !!clientDB;
  }

  /**
   * Verificar si el email ya esta registrado
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
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
      throw new NotFoundException('Client not found');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email
    };
  }

  /**
   * Verificar si el email ya esta registrado con Google Auth
   * @param email Email del cliente
   * @returns Email registrado con Google Auth
   */
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

  /**
   * Actualizar la fecha de último login del cliente
   * @param id Id del cliente
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: {
        lastLogin: new Date()
      }
    });
  }

  /**
   * Actualizar el token de refresco del cliente
   * @param id Id del cliente
   * @param token Token de refresco
   */
  async updateToken(id: string, token: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: {
        token
      }
    });
  }
}
