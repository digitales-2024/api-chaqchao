import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { NotificationData } from 'src/interfaces/notification.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { HttpResponse } from 'src/interfaces';

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

  /**
   * Creacion de una nueva notificacion
   * @param createNotificationDto Data de notificacion
   * @returns Notificacion creada
   */
  async create(
    createNotificationDto: CreateNotificationDto
  ): Promise<HttpResponse<NotificationData>> {
    const { description, notificationType, clientId, orderId } = createNotificationDto;
    let newNotification;

    try {
      // Crear nueva Notificacion
      newNotification = await this.prisma.$transaction(async () => {
        const notification = await this.prisma.notification.create({
          data: {
            description,
            notificationType,
            clientId,
            orderId
          },
          select: {
            id: true,
            description: true,
            notificationType: true,
            client: {
              select: {
                id: true,
                name: true
              }
            },
            order: {
              select: {
                id: true
              }
            }
          }
        });
        return notification;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Notification created successfully',
        data: {
          id: newNotification.id,
          description: newNotification.description,
          notificationType: newNotification.notificationType,
          clientId: newNotification.clientId,
          orderId: newNotification.orderId,
          client: {
            id: newNotification.client.id,
            name: newNotification.client.name
          },
          order: {
            id: newNotification.order.id
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Notification: ${error.message}`, error.stack);
      handleException(error, 'Error creating Notification');
    }
  }
}
