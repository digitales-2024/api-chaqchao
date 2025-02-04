import { BillingDocument } from '@prisma/client';

export type BillingDocumentData = Pick<
  BillingDocument,
  | 'id'
  | 'documentNumber'
  | 'orderId'
  | 'paymentStatus'
  | 'totalAmount'
  | 'billingDocumentType'
  | 'issuedAt'
  | 'typeDocument'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'postalCode'
  | 'businessName'
> & {
  order: { id: string };
};
