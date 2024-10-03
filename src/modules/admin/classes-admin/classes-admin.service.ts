import { Injectable, Logger } from '@nestjs/common';
import { ClassesData, ClassesDataAdmin } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import * as moment from 'moment-timezone';

@Injectable()
export class ClassesAdminService {
  private readonly logger = new Logger(ClassesAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Agrupar los datos de las clases registradas
   * @param classesRegistrations Clases registradas
   * @returns Clases agrupadas
   */
  private groupClassesData(classesRegistrations: ClassesData[]): ClassesDataAdmin[] {
    // Definir el tipo del acumulador
    type GroupedData = {
      [key: string]: {
        dateClass: string;
        scheduleClass: string;
        totalParticipants: number;
        languageClass: string;
        classes: ClassesData[];
      };
    };

    // Agrupar los resultados por dateClass y scheduleClass
    const groupedData = classesRegistrations.reduce((acc: GroupedData, classItem) => {
      const key = `${classItem.dateClass}-${classItem.scheduleClass}`;
      if (!acc[key]) {
        acc[key] = {
          dateClass: moment.utc(classItem.dateClass).tz('America/Lima-5').format('YYYY-MM-DD'),
          scheduleClass: classItem.scheduleClass,
          totalParticipants: 0,
          languageClass: classItem.languageClass,
          classes: []
        };
      }
      acc[key].totalParticipants += classItem.totalParticipants;
      acc[key].classes.push(classItem);
      return acc;
    }, {});

    // Convertir el objeto agrupado en un array
    return Object.values(groupedData).map((group) => ({
      dateClass: group.dateClass,
      scheduleClass: group.scheduleClass,
      totalParticipants: group.totalParticipants,
      languageClass: group.languageClass,
      classes: group.classes.map((classItem) => ({
        id: classItem.id,
        userName: classItem.userName,
        userEmail: classItem.userEmail,
        userPhone: classItem.userPhone,
        totalParticipants: classItem.totalParticipants,
        totalAdults: classItem.totalAdults,
        totalChildren: classItem.totalChildren,
        totalPrice: classItem.totalPrice,
        totalPriceAdults: classItem.totalPriceAdults,
        totalPriceChildren: classItem.totalPriceChildren,
        languageClass: classItem.languageClass,
        typeCurrency: classItem.typeCurrency,
        dateClass: classItem.dateClass,
        scheduleClass: classItem.scheduleClass
      }))
    }));
  }

  /**
   * Mostar todas las clases registradass
   * @returns Clases registradas
   */
  async findAll(): Promise<ClassesDataAdmin[]> {
    try {
      const classesRegistrations = await this.prisma.classes.findMany({
        select: {
          id: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          totalParticipants: true,
          totalAdults: true,
          totalChildren: true,
          totalPrice: true,
          totalPriceAdults: true,
          totalPriceChildren: true,
          languageClass: true,
          typeCurrency: true,
          dateClass: true,
          scheduleClass: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Llamar a la función de agrupación
      const result = this.groupClassesData(classesRegistrations);

      return result as ClassesDataAdmin[];
    } catch (error) {
      this.logger.error('Error getting all products');
      handleException(error, 'Error getting all products');
    }
  }

  /**
   * Mostrar todos los registros de clases por fecha
   * @param date Fecha de la clase
   * @returns Registros de clases por fecha
   */
  async findByDate(date: string): Promise<ClassesDataAdmin[]> {
    console.log('date', date);
    try {
      const classesRegistrations = await this.prisma.classes.findMany({
        where: {
          dateClass: new Date(date)
        },
        select: {
          id: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          totalParticipants: true,
          totalAdults: true,
          totalChildren: true,
          totalPrice: true,
          totalPriceAdults: true,
          totalPriceChildren: true,
          languageClass: true,
          typeCurrency: true,
          dateClass: true,
          scheduleClass: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Llamar a la función de agrupación
      const result = this.groupClassesData(classesRegistrations);

      return result as ClassesDataAdmin[];
    } catch (error) {
      this.logger.error('Error getting all products');
      handleException(error, 'Error getting all products');
    }
  }
}
