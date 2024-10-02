import { CartStatus, Order } from '@prisma/client';

export type OrderData = Pick<
  Order,
  | 'id'
  | 'orderStatus'
  | 'pickupAddress'
  | 'pickupTime'
  | 'comments'
  | 'isActive'
  | 'cartId'
  | 'someonePickup'
  | 'pickupCode'
> & {
  cart: { id: string; clientId: string; cartStatus: CartStatus };
};
