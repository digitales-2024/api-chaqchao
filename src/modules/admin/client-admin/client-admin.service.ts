import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { ClientPayload, UserData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';

@Injectable()
export class ClientAdminService {
  private readonly logger = new Logger(ClientAdminService.name);
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Obtiene todos los clientes
   * @returns Todos los clientes
   */
  async findAll(): Promise<ClientPayload[]> {
    try {
      const clients = await this.prisma.client.findMany({
        where: {},
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

      // Mapea los resultados al tipo ClientPayload
      return clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        birthDate: client.birthDate,
        isGoogleAuth: client.isGoogleAuth,
        lastLogin: client.lastLogin,
        isActive: client.isActive
      })) as ClientPayload[];
    } catch (error) {
      this.logger.error('Error getting all clients');
      handleException(error, 'Error getting all clients');
    }
  }

  /**
   * Actualiza un cliente por su ID
   * @param id ID del cliente a actualizar
   * @param data Datos a actualizar
   * @returns El cliente actualizado
   */
  async update(id: string, data: Partial<ClientPayload>, user: UserData): Promise<ClientPayload> {
    try {
      const updatedClient = await this.prisma.client.update({
        where: { id },
        data,
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

      // Crear un registro de auditoría
      await this.prisma.audit.create({
        data: {
          entityId: updatedClient.id,
          action: AuditActionType.UPDATE,
          performedById: user.id,
          entityType: 'Client Admin'
        }
      });

      return updatedClient as ClientPayload;
    } catch (error) {
      this.logger.error('Error updating client with id ${id}');
      handleException(error, 'Error updating client with id ${id}');
    }
  }

  /**
   * Alternar estado de activación de un Client Admin
   * @param id Id del Client Admin
   * @param user Usuario que realiza la acción
   * @returns Client Admin actualizado
   */
  async toggleActivation(id: string, user: UserData): Promise<ClientPayload> {
    try {
      const clientAdminUpdated = await this.prisma.$transaction(async (prisma) => {
        const clientAdminDB = await prisma.client.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true
          }
        });

        if (!clientAdminDB) {
          throw new NotFoundException('Client Admin not found');
        }

        // Alternar el estado de activación
        const newIsActive = !clientAdminDB.isActive;

        // Actualizar el estado de activación del cliente
        await prisma.client.update({
          where: { id },
          data: {
            isActive: newIsActive
          }
        });

        // Crear un registro de auditoría
        await this.prisma.audit.create({
          data: {
            entityId: clientAdminDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'Client Admin'
          }
        });

        return {
          id: clientAdminDB.id,
          name: clientAdminDB.name,
          email: clientAdminDB.email,
          phone: clientAdminDB.phone,
          isActive: newIsActive
        };
      });

      const action = clientAdminUpdated.isActive ? 'activated' : 'deactivated';

      this.logger.log(`Client Admin with id: ${id} has been ${action}.`);
      return clientAdminUpdated as ClientPayload;
    } catch (error) {
      this.logger.error('Error toggling activation for Client Admin with id: ${id}', error.stack);
      handleException(error, 'Error toggling activation for Client Admin');
    }
  }
}
