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
  | 'comments'
  | 'status'
  | 'typeClass'
>;

export type ClassesDataWithExpires = ClassesData & { expiresAt: Date };

export type ClassesDataAdmin = {
  dateClass: string;
  scheduleClass: string;
  totalParticipants: number;
  languageClass: string;
  classes: ClassesData[];
};
