import { ProductVariationData } from './product-variation.interface';

export interface ProductImageData {
  id: string;
  url: string;
  order: number;
  isMain: boolean;
}

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  isRestricted?: boolean;
  category: {
    id: string;
    name: string;
  };
  variations: ProductVariationData[];
  images: ProductImageData[];
}
