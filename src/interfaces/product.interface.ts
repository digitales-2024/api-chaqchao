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
  maxStock: number;
  category: {
    id: string;
    name: string;
    family: string;
  };
  images: ProductImageData[];
}
