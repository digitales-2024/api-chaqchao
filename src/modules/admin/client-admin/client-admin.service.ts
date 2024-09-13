import { Injectable, Logger } from '@nestjs/common';
import { ClientPayload } from 'src/interfaces';
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
        where: { isActive: true },
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
}
