import { BillingDocument } from '@prisma/client';

export type BillingDocumentData = Pick<
  BillingDocument,
  | 'id'
  | 'documentNumber'
  | 'orderId'
  | 'paymentStatus'
  | 'totalAmount'
  | 'billingDocumentType'
  | 'ruc'
> & {
  order: { id: string };
};
