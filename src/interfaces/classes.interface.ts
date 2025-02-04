import { Classes, ClassRegister, TypeClass } from '@prisma/client';

export type ClassesData = Pick<
  Classes,
  'id' | 'languageClass' | 'dateClass' | 'scheduleClass' | 'typeClass'
>;

export type ClassRegisterData = Pick<
  ClassRegister,
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
  | 'typeCurrency'
  | 'comments'
  | 'status'
>;

export type ClassesDataWithExpires = ClassesData & { expiresAt: Date };

export type ClassesDataAdmin = {
  dateClass: Date;
  scheduleClass: string;
  totalParticipants: number;
  languageClass: string;
  typeClass: TypeClass;
  isClosed: boolean;
  registers: ClassRegisterData[];
};

export type ClassClosed = {
  dateClass: Date;
  scheduleClass: string;
};
