import { Injectable, Logger } from '@nestjs/common';
import { NotificationData } from 'src/interfaces/notification.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mostrar todas las Notifications
   * @returns Todas las Notifications
   */
  async findAll(): Promise<NotificationData[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {},
        select: {
          id: true,
          description: true,
          notificationType: true,
          isRead: true,
          clientId: true,
          orderId: true
        }
      });

      return notifications.map((notification) => ({
        id: notification.id,
        description: notification.description,
        notificationType: notification.notificationType,
        clientId: notification.clientId,
        orderId: notification.orderId
      })) as NotificationData[];
    } catch (error) {
      this.logger.error('Error getting all notifications');
      handleException(error, 'Error getting all Notifications');
    }
  }
}
