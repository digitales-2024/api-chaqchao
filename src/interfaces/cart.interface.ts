import { Cart, CartStatus } from '@prisma/client';

export type CartData = Pick<Cart, 'id' | 'clientId' | 'cartStatus'> & {
  client: { id: string; name: string };
};

export type CartCreateData = {
  clientId?: string;
  cartStatus: CartStatus;
};

export type CartDataComplet = {
  id: string;
  clientId: string;
  cartStatus: CartStatus;
  items: CartItemData[];
};

export type CartItemData = {
  id: string;
  productId: string;
  quantity: number;
};
