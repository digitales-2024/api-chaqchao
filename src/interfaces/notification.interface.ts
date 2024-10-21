import { Notification } from '@prisma/client';

export type NotificationData = Pick<
  Notification,
  'id' | 'description' | 'notificationType' | 'clientId' | 'orderId'
> & {
  client: { id: string; name: string };
  order: { id: string };
};
