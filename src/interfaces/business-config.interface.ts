import { BusinessConfig } from '@prisma/client';

export type BusinessConfigData = Pick<
  BusinessConfig,
  'id' | 'businessName' | 'contactNumber' | 'email' | 'address'
>;
