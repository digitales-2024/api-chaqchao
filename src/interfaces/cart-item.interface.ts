import { CartItem } from '@prisma/client';
import { ProductVariationData } from './product-variation.interface';

export type CartItemData = Pick<CartItem, 'id' | 'cartId' | 'productId' | 'quantity' | 'price'> & {
  cart: { id: string; cartStatus: string };
  product: { id: string; name: string; price: number; productVariations: ProductVariationData[] };
};
