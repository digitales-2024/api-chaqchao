import { Injectable, Logger } from '@nestjs/common';
import { ClassesData, ClassesDataAdmin } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import * as moment from 'moment-timezone';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { ClassStatus, TypeClass, TypeCurrency } from '@prisma/client';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';

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
        typeClass: TypeClass;
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
          typeClass: classItem.typeClass,
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
      typeClass: group.typeClass,
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
        scheduleClass: classItem.scheduleClass,
        comments: classItem.comments,
        status: classItem.status,
        typeClass: classItem.typeClass
      }))
    }));
  }

  /**
   * Crear una clase desde el panel de administración
   * @param data Datos de la clase a crear
   * @returns Clase creada
   */
  async createClass(data: CreateClassAdminDto): Promise<ClassesData> {
    try {
      const classCreated = await this.prisma.classes.create({
        data: {
          typeClass: data.typeClass,
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone,
          totalParticipants: data.totalAdults + data.totalChildren,
          totalAdults: data.totalAdults,
          totalChildren: data.totalChildren,
          totalPrice: data.totalPrice,
          totalPriceAdults: data.totalPriceAdults,
          totalPriceChildren: data.totalPriceChildren,
          languageClass: data.languageClass,
          typeCurrency: TypeCurrency.DOLAR,
          dateClass: data.dateClass,
          scheduleClass: data.scheduleClass,
          comments: data.comments,
          status: ClassStatus.CONFIRMED
        }
      });
      return classCreated;
    } catch (error) {
      this.logger.error('Error creating class');
      handleException(error, 'Error creating class');
    }
  }

  /**
   * Mostrar todos los registros de clases por fecha
   * @param date Fecha de la clase
   * @returns Registros de clases por fecha
   */
  async findByDate(date: string): Promise<ClassesDataAdmin[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999); // Fin del día en UTC

    try {
      const classesRegistrations = await this.prisma.classes.findMany({
        where: {
          dateClass: {
            gte: startOfDay, // Mayor o igual al inicio del día
            lte: endOfDay // Menor o igual al fin del día
          },
          status: ClassStatus.CONFIRMED
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
          scheduleClass: true,
          comments: true,
          status: true,
          typeClass: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Llamar a la función de agrupación
      const result = this.groupClassesData(classesRegistrations);

      return result as ClassesDataAdmin[];
    } catch (error) {
      this.logger.error('Error getting all classes by date');
      handleException(error, 'Error getting all classes by date');
    }
  }

  /**
   * Generar un archivo Excel con los datos de las clases
   * @param data Datos de las clases
   * @returns Archivo Excel
   */
  async generateExcelClasssesAdmin(data: ClassesDataAdmin[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registro de Clases');

    // Definir las columnas para la tabla de detalles
    worksheet.columns = [
      { header: 'Nombre de Usuario', key: 'userName', width: 20 },
      { header: 'Email de Usuario', key: 'userEmail', width: 30 },
      { header: 'Teléfono de Usuario', key: 'userPhone', width: 20 },
      { header: 'Total Participantes', key: 'totalParticipants', width: 18 },
      { header: 'Total Adultos', key: 'totalAdults', width: 12 },
      { header: 'Total Niños', key: 'totalChildren', width: 12 },
      { header: 'Precio Total', key: 'totalPrice', width: 12 },
      { header: 'Precio Adultos', key: 'totalPriceAdults', width: 15 },
      { header: 'Precio Niños', key: 'totalPriceChildren', width: 15 }
    ];

    // Agrupar las clases por fecha y horario
    const groupedClasses = this.groupClassesByDateAndSchedule(data);

    // Iterar sobre los grupos y agregar las tablas
    for (const date in groupedClasses) {
      for (const schedule in groupedClasses[date]) {
        const classes = groupedClasses[date][schedule];

        // Sumar los totales
        let totalParticipants = 0;
        let totalPrice = 0;
        const typeCurrency = classes[0].typeCurrency; // Asumir que todos tienen el mismo tipo de moneda
        const languageClass = classes[0].languageClass; // Asumir que todos tienen el mismo idioma de clase

        classes.forEach((clase) => {
          totalParticipants += clase.totalParticipants;
          totalPrice += clase.totalPrice;
        });

        // Agregar la tabla de resumen con 2 columnas y 6 filas
        worksheet.addRow(['Fecha de Clase', date]);
        worksheet.addRow(['Horario de Clase', schedule]);
        worksheet.addRow(['Idioma de Clase', languageClass]);
        worksheet.addRow(['Tipo de Moneda', typeCurrency]);
        worksheet.addRow(['Total Participantes', totalParticipants]);
        worksheet.addRow(['Total Precio', totalPrice.toFixed(2)]);

        // Espacio entre las tablas
        worksheet.addRow([]);

        // Agregar los detalles de cada clase en la segunda tabla
        worksheet.addRow({
          userName: 'Nombre de Usuario',
          userEmail: 'Email de Usuario',
          userPhone: 'Teléfono de Usuario',
          totalParticipants: 'Total Participantes',
          totalAdults: 'Total Adultos',
          totalChildren: 'Total Niños',
          totalPrice: 'Precio Total',
          totalPriceAdults: 'Precio Adultos',
          totalPriceChildren: 'Precio Niños'
        });

        // Agregar los detalles de cada clase
        classes.forEach((clase) => {
          worksheet.addRow({
            userName: clase.userName,
            userEmail: clase.userEmail,
            userPhone: clase.userPhone,
            totalParticipants: clase.totalParticipants,
            totalAdults: clase.totalAdults,
            totalChildren: clase.totalChildren,
            totalPrice: clase.totalPrice,
            totalPriceAdults: clase.totalPriceAdults,
            totalPriceChildren: clase.totalPriceChildren
          });
        });

        // Agregar una fila vacía después de cada grupo
        worksheet.addRow([]);
      }
    }

    // Eliminar el contenido de las celdas de la fila 1 (A1 a I1)
    for (let col = 1; col <= 9; col++) {
      worksheet.getCell(1, col).value = null; // Limpia la celda en la fila 1, columna col
    }

    // Escribir el archivo a un buffer y devolverlo
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Exportar un archivo PDF con los datos de las clases
   * @param data Datos de las clases
   * @returns Archivo PDF con los datos de las clases
   */
  async generatePDFClassReport(data: ClassesDataAdmin[]): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'classesReport.html');

    // Leer el contenido de la plantilla HTML
    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    const infoBussiness = await this.prisma.businessConfig.findFirst({
      select: {
        businessName: true
      }
    });

    const htmlInfo = `<h2>${infoBussiness.businessName.toUpperCase() || ''}</h2>
    <p>Fecha de las clases: ${(data.length !== 0 ? data[0].dateClass : '') || ''} </p>
    `;

    // Generar el contenido HTML para las clases
    const classesHtml = this.generateClassHtml(data);

    // Reemplazar la plantilla con el contenido HTML de las clases
    const htmlContent = templateHtml.replace('{{classess}}', classesHtml);
    const htmlContentWithInfo = htmlContent.replace('{{bussiness}}', htmlInfo);
    const htmlDateReport = htmlContentWithInfo.replace(
      '{{dateReport}}',
      new Date().toLocaleDateString()
    );
    const htmlFooterReport = htmlDateReport.replace(
      '{{footerReport}}',
      `© ${new Date().getFullYear()} ${infoBussiness.businessName.toUpperCase()}`
    );

    // Generar el PDF usando Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setContent(htmlContentWithInfo);
    await page.setContent(htmlDateReport);
    await page.setContent(htmlFooterReport);
    const pdfBufferUint8Array = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
  }

  /**
   * Generar el contenido HTML con los datos de las clases
   * @param data Data de las clases
   * @returns Generar HTML con los datos de las clases
   */
  private generateClassHtml(data: ClassesDataAdmin[]): string {
    let classesHtml = '';

    // Agrupar las clases por fecha y horario
    const groupedClasses = this.groupClassesByDateAndSchedule(data);

    // Iterar sobre cada grupo y generar HTML
    for (const date in groupedClasses) {
      for (const schedule in groupedClasses[date]) {
        classesHtml += `<h3 style="text-align: center;">Horario: ${schedule}</h3>`;
        classesHtml += '<div style="overflow-x:auto; margin: 0 20px;">';
        classesHtml += '<table>';
        classesHtml += `
                <thead>
                    <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Idioma</th>
                    <th>Total Adultos</th>
                    <th>Total Niños</th>
                    <th>Total Participantes</th>
                    </tr>
                </thead>
                <tbody>
            `;

        let totalParticipants = 0;
        let totalPrice = 0;

        groupedClasses[date][schedule].forEach((clase) => {
          classesHtml += `<tr>
          <td style="text-transform: capitalize;">${clase.userName}</td>
          <td>${clase.userEmail}</td>
          <td>${clase.userPhone}</td>
          <td>${clase.languageClass}</td>
          <td>${clase.totalAdults}</td>
          <td>${clase.totalChildren}</td>
          <td>${clase.totalParticipants}</td>
                </tr>`;

          // Sumar los totales
          totalParticipants += clase.totalParticipants;
          totalPrice += clase.totalPrice;
        });

        classesHtml += '</tbody></table>';

        // Determinar el símbolo de la moneda
        const currencySymbol =
          groupedClasses[date][schedule][0].typeCurrency === 'SOL' ? 'S/.' : '$';

        // Agregar el resumen después de la tabla
        classesHtml += `
                <div class="company-info">
                    <p>Total de Participantes: ${totalParticipants}</p>
                    <p>Total: ${currencySymbol} ${totalPrice.toFixed(2)}</p>
                </div>
            `;

        classesHtml += '</div>'; // Cerrar el contenedor
      }
    }

    return classesHtml;
  }

  /**
   * Agrupar las clases por fecha y horario
   * @param data Datos de las clases
   * @returns Clases agrupadas por fecha y horario
   */
  private groupClassesByDateAndSchedule(
    data: ClassesDataAdmin[]
  ): Record<string, Record<string, ClassesData[]>> {
    const groupedClasses: Record<string, Record<string, ClassesData[]>> = {};

    data.forEach((classData) => {
      const dateKey = classData.dateClass;

      if (!groupedClasses[dateKey]) {
        groupedClasses[dateKey] = {};
      }

      const scheduleKey = classData.scheduleClass;

      if (!groupedClasses[dateKey][scheduleKey]) {
        groupedClasses[dateKey][scheduleKey] = [];
      }

      // Agregar las clases a su respectivo grupo
      groupedClasses[dateKey][scheduleKey].push(...classData.classes);
    });

    return groupedClasses;
  }
}
