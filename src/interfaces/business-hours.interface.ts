import { BusinessHours } from '@prisma/client';

export type BusinessHoursData = Pick<
  BusinessHours,
  'id' | 'dayOfWeek' | 'openingTime' | 'closingTime' | 'isOpen'
>;
export type AllBusinessHoursData = {
  businessHours: BusinessHoursData[];
  businessInfo: {
    id: string;
    businessName: string;
    contactNumber: string;
    email: string;
    address: string;
  };
};
