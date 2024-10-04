import { Injectable, Logger } from '@nestjs/common';
import { ClassesData, ClassesDataAdmin } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import * as moment from 'moment-timezone';
import * as ExcelJS from 'exceljs';

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

  /**
   * Generar un archivo Excel con los datos de las clases
   * @param data Datos de las clases
   * @returns Archivo Excel
   */
  async generateExcelClasssesAdmin(data: ClassesDataAdmin[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Clases');

    // Definir las columnas en español y con el orden especificado
    worksheet.columns = [
      { header: 'Fecha de Clase', key: 'dateClass', width: 15 },
      { header: 'Horario de Clase', key: 'scheduleClass', width: 15 },
      { header: 'Idioma de Clase', key: 'languageClass', width: 15 },
      { header: 'Nombre de Usuario', key: 'userName', width: 20 },
      { header: 'Email de Usuario', key: 'userEmail', width: 30 },
      { header: 'Teléfono de Usuario', key: 'userPhone', width: 20 },
      { header: 'Total Participantes', key: 'totalParticipants', width: 18 },
      { header: 'Total Adultos', key: 'totalAdults', width: 12 },
      { header: 'Total Niños', key: 'totalChildren', width: 12 },
      { header: 'Precio Total', key: 'totalPrice', width: 12 },
      { header: 'Precio Adultos', key: 'totalPriceAdults', width: 15 },
      { header: 'Precio Niños', key: 'totalPriceChildren', width: 15 },
      { header: 'Tipo de Moneda', key: 'typeCurrency', width: 12 }
    ];

    // Iterar sobre los datos de la clase y agregar cada fila
    data.forEach((classData) => {
      classData.classes.forEach((clase) => {
        worksheet.addRow({
          dateClass: clase.dateClass,
          scheduleClass: clase.scheduleClass,
          totalParticipants: clase.totalParticipants,
          languageClass: clase.languageClass,
          userName: clase.userName,
          userEmail: clase.userEmail,
          userPhone: clase.userPhone,
          totalAdults: clase.totalAdults,
          totalChildren: clase.totalChildren,
          totalPrice: clase.totalPrice,
          totalPriceAdults: clase.totalPriceAdults,
          totalPriceChildren: clase.totalPriceChildren,
          typeCurrency: clase.typeCurrency
        });
      });
    });

    // Escribir el archivo a un buffer y devolverlo
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
