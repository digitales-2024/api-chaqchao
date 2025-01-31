import { TypeCurrency } from '@prisma/client';

export interface EventPayloads {
  'user.welcome-admin-first': { name: string; email: string; password: string; webAdmin: string };
  'user.new-password': { name: string; email: string; password: string; webAdmin: string };
  'user.reset-password': { name: string; email: string; link: string };
  'user.verify-email': { name: string; email: string; otp: string };
  'client.forgot-password': { name: string; email: string; link: string };
  'class.new-class': {
    name: string;
    email: string;
    dateClass: string;
    scheduleClass: string;
    languageClass: string;
    totalParticipants: number;
    totalPrice: number;
    typeCurrency: TypeCurrency;
  };
  'order.new-order': {
    name: string;
    email: string;
    orderNumber: string;
    totalOrder: string;
    pickupDate: string;
  };
  'order.order-completed': {
    name: string;
    email: string;
    orderNumber: string;
    totalOrder: string;
    pickupDate: string;
    products: {
      name: string;
      quantity: number;
      price: number;
      image: string;
    }[];
  };
}
