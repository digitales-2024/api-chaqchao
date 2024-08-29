import { BusinessHours } from '@prisma/client';

export type BusinessHoursData = Pick<
  BusinessHours,
  'id' | 'dayOfWeek' | 'openingTime' | 'closingTime' | 'isOpen'
> & {
  businessConfig: {
    id: string;
    businessName: string;
    contactNumber: string;
    email: string;
    address: string;
  };
};
