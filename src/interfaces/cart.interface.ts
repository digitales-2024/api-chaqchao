import { Cart } from '@prisma/client';

export type CartData = Pick<Cart, 'id' | 'clientId' | 'cartStatus'> & {
  client: { id: string; name: string };
};
