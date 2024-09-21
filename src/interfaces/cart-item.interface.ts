import { CartItem } from '@prisma/client';

export type CartItemData = Pick<CartItem, 'id' | 'cartId' | 'productId' | 'quantity' | 'price'> & {
  cart: { id: string; cartStatus: string };
  product: { id: string; name: string; price: number };
};
