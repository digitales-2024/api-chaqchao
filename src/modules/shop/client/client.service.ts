import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientData, ClientDataUpdate, ClientPayload, HttpResponse } from 'src/interfaces';
import { handleException } from 'src/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import { UpdatePasswordClientDto } from './dto/update-password-client.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buscar un cliente por su id
   * @param id Id del cliente
   * @returns Cliente encontrado
   */
  async findOne(id: string): Promise<ClientPayload> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get client', error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get client');
    }
  }

  /**
   * Actualizar un cliente
   * @param id Id del cliente
   * @param updateClientDto Data del cliente a actualizar
   * @returns Cliente actualizado
   */
  async update(
    id: string,
    updateClientDto: UpdateClientDto
  ): Promise<HttpResponse<ClientDataUpdate>> {
    const { name, phone, birthDate } = updateClientDto;

    try {
      const clientDB = await this.findById(id);
      if (!clientDB) {
        throw new NotFoundException('Client not found');
      }

      // Validar si hay cambios
      const noChanges =
        name === clientDB.name &&
        phone === clientDB.phone &&
        birthDate?.toISOString() === clientDB.birthDate?.toISOString();

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Client updated successfully',
          data: {
            id: clientDB.id,
            name: clientDB.name,
            phone: clientDB.phone,
            birthDate: clientDB.birthDate
          }
        };
      }

      // Construir el objeto de actualización dinámicamente
      const updateData: any = {};
      if (name !== clientDB.name) updateData.name = name;
      if (phone !== clientDB.phone) updateData.phone = phone;
      if (birthDate?.toISOString() !== clientDB.birthDate?.toISOString())
        updateData.birthDate = birthDate;

      // Transacción para realizar la actualización
      const updatedClient = await this.prisma.$transaction(async (prisma) => {
        return prisma.client.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            phone: true,
            birthDate: true
          }
        });
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Client updated successfully',
        data: updatedClient
      };
    } catch (error) {
      this.logger.error(`Error updating client for id: ${id}`, error.stack);
      handleException(error, 'Error updating client');
    }
  }

  /**
   * Actualizar la contraseña de un cliente
   * @param id Id del cliente
   * @param updatePasswordClientDto Data para actualizar la contraseña
   * @returns Contraseña actualizada
   */
  async updatePassword(
    id: string,
    updatePasswordClientDto: UpdatePasswordClientDto
  ): Promise<HttpResponse<ClientData>> {
    const { password, newPassword, confirmPassword } = updatePasswordClientDto;
    try {
      const clientInformation = await this.findById(id);
      await this.findByEmailRegisteredGoogle(clientInformation.email);
      const clientDB = await this.findByEmail(clientInformation.email);

      // Comparar la contraseña actual
      const isPasswordValid = await bcrypt.compare(password, clientDB.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Validar que la nueva contraseña y la confirmación sean iguales
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('New password and confirm password do not match');
      }

      // Encriptar la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña en la base de datos
      await this.prisma.client.update({
        where: { id },
        data: { password: hashedPassword }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Password updated successfully',
        data: {
          id: clientDB.id,
          name: clientDB.name,
          email: clientDB.email
        }
      };
    } catch (error) {
      this.logger.error(`Error updating password client for id: ${id}`, error.stack);
      handleException(error, 'Error updating password client');
    }
  }

  /**
   * Eliminar un cliente
   * @param id Id del cliente
   * @returns Cliente eliminado
   */
  async remove(id: string, res: Response): Promise<HttpResponse<ClientData>> {
    try {
      const clientDB = await this.findById(id);
      if (!clientDB) {
        throw new NotFoundException('Client not found');
      }

      await this.prisma.client.update({
        where: { id },
        data: {
          isActive: false
        }
      });

      // Eliminar la cookie 'access_token'
      res.cookie('access_token', '', {
        httpOnly: true,
        expires: new Date(0) // Establece la fecha de expiración a una fecha pasada para eliminar la cookie
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Client removed successfully',
        data: {
          id: clientDB.id,
          name: clientDB.name,
          email: clientDB.email
        }
      };
    } catch (error) {
      this.logger.error(`Error removing client for id: ${id}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error removing client');
    }
  }

  /**
   * Mostar un cliente por su id
   * @param id Id del cliente
   * @returns Cliente encontrado
   */
  async findById(id: string): Promise<ClientPayload> {
    const clientDB = await this.prisma.client.findUnique({
      where: { id },
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

    if (clientDB && !clientDB.isActive) {
      throw new BadRequestException('Client exist but is inactive');
    }
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
