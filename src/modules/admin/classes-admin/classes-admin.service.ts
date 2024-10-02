import { Injectable, Logger } from '@nestjs/common';
import { ClassesData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';

@Injectable()
export class ClassesAdminService {
  private readonly logger = new Logger(ClassesAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mostar todas las clases registradass
   * @returns Clases registradas
   */
  async findAll(): Promise<ClassesData[]> {
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
          typeCurrency: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Mapea los resultados al tipo ClassesData
      return classesRegistrations.map((classItem) => ({
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
        typeCurrency: classItem.typeCurrency
      })) as ClassesData[];
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
  async findByDate(date: string): Promise<ClassesData[]> {
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
          typeCurrency: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Mapea los resultados al tipo ClassesData
      return classesRegistrations.map((classItem) => ({
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
        typeCurrency: classItem.typeCurrency
      })) as ClassesData[];
    } catch (error) {
      this.logger.error('Error getting all products');
      handleException(error, 'Error getting all products');
    }
  }

  remove(id: string) {
    return `This action removes a #${id} classesAdmin`;
  }
}
