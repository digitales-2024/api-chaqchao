import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ClassClosed, ClassesDataAdmin, ClassRegisterData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { ClassStatus, TypeClass, TypeCurrency } from '@prisma/client';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class ClassesAdminService {
  private readonly logger = new Logger(ClassesAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una clase desde el panel de administración
   * @param data Datos de la clase a crear
   * @returns Clase creada
   */
  async createClass(data: CreateClassAdminDto): Promise<ClassRegisterData> {
    const { dateClass, scheduleClass, typeClass } = data;

    // Buscamos si ya hay una clase en la fecha y horario especificados
    try {
      // Iniciar la transacción
      return await this.prisma.$transaction(async (prisma) => {
        // Buscar una clase existente para la fecha y hora
        let classEntity = await prisma.classes.findFirst({
          where: { dateClass, scheduleClass, typeClass }
        });

        if (classEntity && classEntity.isClosed) {
          throw new BadRequestException('La clase ya se encuentra cerrada');
        }

        if (!classEntity) {
          // Si no existe, crear una nueva clase
          classEntity = await prisma.classes.create({
            data: {
              dateClass,
              scheduleClass,
              totalParticipants: 0,
              typeClass: data.typeClass,
              languageClass: data.languageClass,
              isClosed: data.isClosed
            }
          });
        }

        // Verificar si la capacidad de la clase ha sido alcanzada o no alcaza al minimo
        const participants = await this.prisma.classCapacity.findFirst({
          where: {
            typeClass: data.typeClass
          },
          select: {
            minCapacity: true,
            maxCapacity: true
          }
        });

        if (
          data.totalAdults + data.totalChildren + classEntity.totalParticipants <
          participants.minCapacity
        ) {
          throw new BadRequestException('La capacidad de la clase tiene que ser mayor a mínimo');
        }

        if (
          data.totalAdults + data.totalChildren + classEntity.totalParticipants >=
          participants.maxCapacity
        ) {
          throw new BadRequestException('La capacidad de la clase ha sido alcanzada');
        }

        // Crear el registro
        const classRegister = await prisma.classRegister.create({
          data: {
            classesId: classEntity.id,
            userName: data.userName,
            userEmail: data.userEmail,
            userPhone: data.userPhone,
            totalParticipants: data.totalAdults + data.totalChildren,
            totalAdults: data.totalAdults,
            totalChildren: data.totalChildren,
            totalPrice: data.totalPrice,
            totalPriceAdults: data.totalPriceAdults,
            totalPriceChildren: data.totalPriceChildren,
            typeCurrency: TypeCurrency.DOLAR,
            status: ClassStatus.CONFIRMED,
            comments: data.comments,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            methodPayment: data.methodPayment
          }
        });

        // Actualizar el total de participantes en la clase
        await prisma.classes.update({
          where: { id: classEntity.id },
          data: {
            totalParticipants: classEntity.totalParticipants + classRegister.totalParticipants
          }
        });

        return classRegister;
      });
    } catch (error) {
      // Manejo de errores específicos de Prisma
      if (error instanceof BadRequestException) {
        throw error; // Errores de validación
      }
      // Otros errores no controlados
      throw new InternalServerErrorException('Ocurrió un error al procesar la solicitud');
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
      const classDB = await this.prisma.classes.findMany({
        where: {
          dateClass: {
            gte: startOfDay, // Mayor o igual al inicio del día
            lte: endOfDay // Menor o igual al fin del día
          }
        },
        select: {
          id: true,
          totalParticipants: true,
          languageClass: true,
          dateClass: true,
          scheduleClass: true,
          typeClass: true,
          isClosed: true,
          ClassRegister: {
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
              typeCurrency: true,
              comments: true,
              status: true
            }
          }
        },
        orderBy: {
          dateClass: 'asc'
        }
      });

      return classDB.map((clase) => ({
        id: clase.id,
        totalParticipants: clase.totalParticipants,
        languageClass: clase.languageClass,
        dateClass: clase.dateClass,
        scheduleClass: clase.scheduleClass,
        typeClass: clase.typeClass,
        isClosed: clase.isClosed,
        registers: clase.ClassRegister.map((registro) => ({
          id: registro.id,
          userName: registro.userName,
          userEmail: registro.userEmail,
          userPhone: registro.userPhone,
          totalParticipants: registro.totalParticipants,
          totalAdults: registro.totalAdults,
          totalChildren: registro.totalChildren,
          totalPrice: registro.totalPrice,
          totalPriceAdults: registro.totalPriceAdults,
          totalPriceChildren: registro.totalPriceChildren,
          typeCurrency: registro.typeCurrency,
          comments: registro.comments,
          status: registro.status
        }))
      }));
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

    // Configurar las columnas de la hoja de trabajo
    this.configureWorksheetColumns(worksheet);

    // Agrupar las clases por fecha y horario
    const groupedClasses = this.groupClassesByDateAndSchedule(data);

    // Agregar los datos agrupados al Excel
    this.populateWorksheetWithGroupedClasses(worksheet, groupedClasses);

    // Eliminar contenido de la fila 1
    this.clearFirstRow(worksheet);

    // Escribir el archivo en un buffer y devolverlo
    return await workbook.xlsx.writeBuffer();
  }

  private configureWorksheetColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns = [
      { header: 'Nombre de Usuario', key: 'userName', width: 20 },
      { header: 'Email de Usuario', key: 'userEmail', width: 30 },
      { header: 'Teléfono de Usuario', key: 'userPhone', width: 20 },
      { header: 'Total Adultos', key: 'totalAdults', width: 12 },
      { header: 'Total Niños', key: 'totalChildren', width: 12 },
      { header: 'Total Participantes', key: 'totalParticipants', width: 18 },
      { header: 'Precio Adultos', key: 'totalPriceAdults', width: 15 },
      { header: 'Precio Niños', key: 'totalPriceChildren', width: 15 },
      { header: 'Precio Total', key: 'totalPrice', width: 12 }
    ];
  }

  private populateWorksheetWithGroupedClasses(
    worksheet: ExcelJS.Worksheet,
    groupedClasses: Record<
      string,
      Record<string, { language: string; registers: ClassRegisterData[] }>
    >
  ) {
    for (const date in groupedClasses) {
      for (const schedule in groupedClasses[date]) {
        const classes = groupedClasses[date][schedule];

        // Calcular totales
        const { totalParticipants, totalPrice } = classes.registers.reduce(
          (totals, clase) => {
            totals.totalParticipants += clase.totalParticipants;
            totals.totalPrice += clase.totalPrice;
            return totals;
          },
          { totalParticipants: 0, totalPrice: 0 }
        );

        // Agregar resumen de clase
        worksheet.addRow(['Fecha de Clase', date]);
        worksheet.addRow(['Horario de Clase', schedule]);
        worksheet.addRow(['Idioma de Clase', classes.language]);
        worksheet.addRow(['Total Participantes', totalParticipants]);
        worksheet.addRow(['Total Precio', totalPrice.toFixed(2)]);
        worksheet.addRow([]); // Espacio entre grupos

        // Agregar encabezados de la tabla de detalles
        worksheet.addRow({
          userName: 'Nombre de Usuario',
          userEmail: 'Email de Usuario',
          userPhone: 'Teléfono de Usuario',
          totalAdults: 'Total Adultos',
          totalChildren: 'Total Niños',
          totalParticipants: 'Total Participantes',
          totalPriceAdults: 'Precio Adultos',
          totalPriceChildren: 'Precio Niños',
          totalPrice: 'Precio Total'
        });

        // Agregar los detalles de cada clase
        classes.registers.forEach((clase) => {
          worksheet.addRow({
            userName: clase.userName,
            userEmail: clase.userEmail,
            userPhone: clase.userPhone,
            totalAdults: clase.totalAdults,
            totalChildren: clase.totalChildren,
            totalParticipants: clase.totalParticipants,
            totalPriceAdults: clase.totalPriceAdults,
            totalPriceChildren: clase.totalPriceChildren,
            totalPrice: clase.totalPrice
          });
        });

        worksheet.addRow([]); // Fila vacía entre tablas
      }
    }
  }

  private clearFirstRow(worksheet: ExcelJS.Worksheet) {
    for (let col = 1; col <= 9; col++) {
      worksheet.getCell(1, col).value = null;
    }
  }

  async generatePDFClassReport(data: ClassesDataAdmin[]): Promise<Buffer> {
    try {
      const templatePath = path.join(__dirname, '../../../../', 'templates', 'classesReport.html');

      // Leer plantilla HTML
      const templateHtml = this.loadHtmlTemplate(templatePath);

      const infoBusiness = await this.getBusinessInfo();

      // Crear contenido del informe
      const htmlInfo = `<h2>${infoBusiness.businessName.toUpperCase()}</h2>
      <p>Fecha de las clases: ${data.length ? format(data[0].dateClass, 'PPP', { locale: es }) : ''}</p>`;
      const classesHtml = this.generateClassHtml(data);

      // Reemplazar placeholders en la plantilla
      const htmlContent = templateHtml
        .replace('{{classess}}', classesHtml)
        .replace('{{bussiness}}', htmlInfo)
        .replace('{{dateReport}}', new Date().toLocaleDateString())
        .replace(
          '{{footerReport}}',
          `© ${new Date().getFullYear()} ${infoBusiness.businessName.toUpperCase()}`
        );

      // Generar PDF con Puppeteer
      return await this.generatePdfFromHtml(htmlContent);
    } catch (error) {
      console.error('Error generando el PDF:', error);
      throw new Error('No se pudo generar el archivo PDF.');
    }
  }

  private loadHtmlTemplate(templatePath: string): string {
    try {
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }
  }

  private async getBusinessInfo() {
    return this.prisma.businessConfig.findFirst({
      select: { businessName: true }
    });
  }

  private async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  private generateClassHtml(data: ClassesDataAdmin[]): string {
    if (!data || data.length === 0) {
      return '<p>No hay clases disponibles para mostrar.</p>';
    }

    let classesHtml = '';

    // Agrupar las clases por fecha y horario
    const groupedClasses = this.groupClassesByDateAndSchedule(data);

    // Iterar sobre cada grupo de clases
    for (const date in groupedClasses) {
      classesHtml += `<h2 style="text-align: center;">Fecha: ${date}</h2>`;

      for (const schedule in groupedClasses[date]) {
        classesHtml += `<h3 style="text-align: center;">Horario: ${schedule}</h3>`;
        classesHtml += '<div style="overflow-x:auto; margin: 0 20px;">';
        classesHtml += '<table border="1" style="width: 100%; border-collapse: collapse;">';
        classesHtml += `
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Total Adultos</th>
            <th>Total Niños</th>
            <th>Total Participantes</th>
          </tr>
        </thead>
        <tbody>
      `;

        let totalParticipants = 0;
        let totalPrice = 0;

        groupedClasses[date][schedule].registers.forEach((clase) => {
          classesHtml += `
          <tr>
            <td style="text-transform: capitalize;">${clase.userName}</td>
            <td>${clase.userEmail}</td>
            <td>${clase.userPhone}</td>
            <td>${clase.totalAdults}</td>
            <td>${clase.totalChildren}</td>
            <td>${clase.totalParticipants}</td>
          </tr>
        `;

          // Sumar totales
          totalParticipants += clase.totalParticipants;
          totalPrice += clase.totalPrice;
        });

        classesHtml += '</tbody></table>';

        // Determinar el símbolo de moneda

        // Agregar resumen después de la tabla
        classesHtml += `
        <div style="margin-top: 10px; text-align: right;">
          <p><strong>Total de Participantes:</strong> ${totalParticipants}</p>
          <p><strong>Total Precio:</strong> ${totalPrice.toFixed(2)}</p>
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
  ): Record<string, Record<string, { language: string; registers: ClassRegisterData[] }>> {
    const groupedClasses: Record<
      string,
      Record<string, { language: string; registers: ClassRegisterData[] }>
    > = {};

    data.forEach((classData) => {
      const dateKey = format(classData.dateClass, 'yyyy-MM-dd');
      const scheduleKey = classData.scheduleClass;

      // Asegurarse de que la fecha exista en el grupo
      if (!groupedClasses[dateKey]) {
        groupedClasses[dateKey] = {};
      }

      // Asegurarse de que el horario exista dentro de la fecha
      if (!groupedClasses[dateKey][scheduleKey]) {
        groupedClasses[dateKey][scheduleKey] = {
          language: classData.languageClass,
          registers: []
        };
      }

      // Agregar los registros al grupo correspondiente
      groupedClasses[dateKey][scheduleKey].registers.push(...classData.registers);
    });

    return groupedClasses;
  }

  /**
   * Buscar si hay una clase creada en la fecha y horario especificados
   * @param dateClass Fecha de la clase
   * @param scheduleClass Horario de la clase
   * @returns Si hay una clase en la fecha y horario especificados
   */
  async checkClassExists(dateClass: Date, scheduleClass: string): Promise<string> {
    const classExists = await this.prisma.classes.findFirst({
      where: {
        dateClass,
        scheduleClass
      }
    });

    return classExists.id || undefined;
  }

  /**
   * Buscar todas las clases futuras
   * @param scheduleClass Horario de la clase
   * @param typeClass Tipo de clase
   * @returns Clases cerradas
   */
  async findAllFutureClasses(
    scheduleClass?: string,
    typeClass?: TypeClass
  ): Promise<ClassClosed[]> {
    // Calculamos la fecha de hoy
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Buscamos todas las clases cerradas en el rango de fechas
    const classesClosed = await this.prisma.classes.findMany({
      where: {
        scheduleClass,
        typeClass,
        dateClass: {
          gte: today
        }
      },
      select: {
        id: true,
        dateClass: true,
        scheduleClass: true,
        isClosed: true
      }
    });

    // Creamos un array con las fechas de las clases cerradas
    const classes: ClassClosed[] = classesClosed.map((classClosed) => ({
      id: classClosed.id,
      dateClass: classClosed.dateClass,
      scheduleClass: classClosed.scheduleClass,
      isClosed: classClosed.isClosed
    }));

    return classes;
  }

  /**
   * Verificar si la clase existe en la fecha y horario especificados
   * @param scheduleClass Horario de la clase
   * @param dateClass Fecha de la clase
   * @param typeClass Tipo de clase
   * @returns Si la clase existe en la fecha y horario especificados
   */
  async checkClass(scheduleClass: string, dateClass: string, typeClass: TypeClass): Promise<any> {
    try {
      const parsedDate = parseISO(dateClass);

      const classExists = await this.prisma.classes.findFirst({
        where: {
          dateClass: parsedDate,
          scheduleClass,
          typeClass
        },
        select: {
          id: true,
          languageClass: true,
          dateClass: true,
          scheduleClass: true,
          typeClass: true,
          isClosed: true,
          totalParticipants: true
        }
      });

      return classExists;
    } catch (error) {
      this.logger.error(`Error checking class: ${error.message}`, error.stack);
      throw new BadRequestException('Error checking class');
    }
  }

  /**
   * Cerrar una clase por su id
   * @param id Id de la clase a cerrar
   * @returns La clase cerrada
   */
  async closeClass(id: string): Promise<ClassClosed> {
    try {
      const classClosed = await this.prisma.classes.update({
        where: { id },
        data: { isClosed: true },
        select: {
          id: true,
          dateClass: true,
          scheduleClass: true,
          isClosed: true
        }
      });

      if (!classClosed) {
        throw new BadRequestException('La clase no existe');
      }

      return classClosed;
    } catch (error) {
      this.logger.error(`Error closing class: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error closing class');
    }
  }
}
