import { Order } from '@prisma/client';

export type OrderData = Pick<
  Order,
  'id' | 'orderStatus' | 'pickupAddress' | 'pickupTime' | 'comments' | 'isActive' | 'cartId'
> & {
  cart: { id: string };
};
