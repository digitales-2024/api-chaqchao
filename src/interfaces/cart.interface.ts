import { Cart, CartStatus } from '@prisma/client';

export type CartData = Pick<Cart, 'id' | 'clientId' | 'cartStatus'> & {
  client: { id: string; name: string };
};

export type CartCreateData = {
  clientId?: string;
  cartStatus: CartStatus;
};
