import { ProductVariation } from '@prisma/client';

export type ProductVariationData = Pick<
  ProductVariation,
  'id' | 'name' | 'description' | 'additionalPrice'
>;
