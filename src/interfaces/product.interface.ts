import { Product } from '@prisma/client';
import { ProductVariationData } from './product-variation.interface';

export type ProductData = Pick<
  Product,
  'id' | 'name' | 'description' | 'price' | 'image' | 'isAvailable' | 'isActive'
> & {
  category: { id: string; name: string };
  variations: ProductVariationData[];
};
