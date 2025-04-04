import {
  ClassLanguage,
  ClassPriceConfig,
  ClassRegistrationConfig,
  ClassSchedule
} from '@prisma/client';

export type ClassPriceConfigData = Pick<
  ClassPriceConfig,
  'id' | 'classTypeUser' | 'price' | 'typeCurrency' | 'typeClass'
>;

export type ClassScheduleData = Pick<ClassSchedule, 'id' | 'startTime' | 'typeClass'>;

export type ClassLanguageData = Pick<ClassLanguage, 'id' | 'languageName'>;

export type ClassRegistrationData = Pick<
  ClassRegistrationConfig,
  'id' | 'closeBeforeStartInterval' | 'finalRegistrationCloseInterval'
>;

export type ClassConfigData = {
  priceConfig: ClassPriceConfigData[];
  languageConfig: ClassLanguageData[];
  registrationConfig: ClassRegistrationData[];
};
