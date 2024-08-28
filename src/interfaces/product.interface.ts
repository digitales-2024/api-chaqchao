import { Product } from '@prisma/client';

export type ProductData = Pick<
  Product,
  'id' | 'name' | 'description' | 'price' | 'image' | 'isAvailable'
> & {
  category: { id: string; name: string };
};
