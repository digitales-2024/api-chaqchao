import { Product } from '@prisma/client';

export type ProductData = Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image'> & {
  category: { id: string; name: string };
};
