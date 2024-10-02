import { Classes } from '@prisma/client';

export type ClassesData = Pick<
  Classes,
  | 'id'
  | 'userName'
  | 'userEmail'
  | 'userPhone'
  | 'totalParticipants'
  | 'totalAdults'
  | 'totalChildren'
  | 'totalPrice'
  | 'totalPriceAdults'
  | 'totalPriceChildren'
  | 'languageClass'
  | 'typeCurrency'
  | 'dateClass'
  | 'scheduleClass'
>;
