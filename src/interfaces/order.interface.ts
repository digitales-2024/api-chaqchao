import { CartStatus, Order } from '@prisma/client';
import { BillingDocumentData } from './billing-document.interface';

export type OrderData = Pick<
  Order,
  | 'id'
  | 'orderStatus'
  | 'pickupAddress'
  | 'pickupTime'
  | 'comments'
  | 'isActive'
  | 'cartId'
  | 'someonePickup'
  | 'pickupCode'
  | 'totalAmount'
> & {
  cart: { id: string; clientId: string; cartStatus: CartStatus };
};

export type OrderInfo = Pick<
  Order,
  | 'id'
  | 'orderStatus'
  | 'pickupAddress'
  | 'pickupTime'
  | 'someonePickup'
  | 'pickupCode'
  | 'totalAmount'
  | 'isActive'
> & {
  client: Client;
};

export type OrderDetails = OrderInfo & {
  cart: { quantity: number; products: ProductData[] };
  billingDocument: Omit<
    BillingDocumentData,
    'order' | 'totalAmount' | 'orderId' | 'id' | 'issuedAt'
  >;
};

interface Client {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ProductImage {
  url: string;
  order: number;
  isMain: boolean;
}

type ProductData = {
  id: string;
  name: string;
  price: number;
  images: ProductImage[];
  quantity: number;
  category: CategoryData;
};

type CategoryData = {
  id: string;
  name: string;
};
