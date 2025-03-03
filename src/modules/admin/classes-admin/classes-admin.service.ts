import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ClassStatus, TypeClass } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { ClassClosed, ClassesDataAdmin, ClassRegisterData } from 'src/interfaces';
import { PrismaService } from '../../../prisma/prisma.service';
import { handleException } from '../../../utils';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';

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
      // Formatear la fecha considerando la zona horaria de Lima
      const formattedDate = formatInTimeZone(dateClass, 'America/Lima', 'yyyy-MM-dd');
      const parsedDate = parseISO(formattedDate);

      // Iniciar la transacción
      return await this.prisma.$transaction(async (prisma) => {
        // Buscar una clase existente para la fecha y hora
        let classEntity = await prisma.classes.findFirst({
          where: { dateClass: parsedDate, scheduleClass, typeClass }
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
          data.totalAdults + data.totalChildren + classEntity.totalParticipants >
          participants.maxCapacity
        ) {
          throw new BadRequestException('La capacidad de la clase ha sido excedida');
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
            allergies: data.allergies,
            occasion: data.occasion,
            typeCurrency: data.typeCurrency,
            status: (data.status as ClassStatus) || ClassStatus.PENDING,
            comments: data.comments,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            methodPayment: data.methodPayment
          }
        });

        // Actualizar el total de participantes en la clase
        await prisma.classes.update({
          where: { id: classEntity.id },
          data: {
            totalParticipants: classEntity.totalParticipants + classRegister.totalParticipants,
            isClosed:
              classEntity.totalParticipants + classRegister.totalParticipants ===
                participants.maxCapacity || data.isClosed
          }
        });

        return classRegister;
      });
    } catch (error) {
      this.logger.error(`Error creating class: ${error.message}`, error.stack);
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
    // Formatear la fecha considerando la zona horaria de Lima
    const formattedDate = formatInTimeZone(parseISO(date), 'America/Lima', 'yyyy-MM-dd');
    const parsedDate = parseISO(formattedDate);

    // Establecer inicio y fin del día en la zona horaria de Lima
    const startOfDay = new Date(parsedDate);
    const endOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

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
              status: true,
              methodPayment: true
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
          status: registro.status,
          methodPayment: registro.methodPayment
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

    // Obtener información de negocio
    const infoBusiness = await this.getBusinessInfo();

    // Añadir título
    const titleRow = worksheet.addRow([infoBusiness.businessName.toUpperCase()]);
    titleRow.font = { bold: true, size: 16 };
    worksheet.addRow([]);

    if (data.length > 0) {
      const dateStr = format(data[0].dateClass, 'PPP', { locale: es });
      worksheet.addRow([`Fecha de las clases: ${dateStr}`]);
    }
    worksheet.addRow([]);

    // Agrupar las clases por fecha y horario
    const groupedClasses = this.groupClassesByDateAndSchedule(data);

    // Agregar los datos agrupados al Excel
    this.populateWorksheetWithGroupedClasses(worksheet, groupedClasses);

    // Aplicar estilos generales
    worksheet.properties.defaultRowHeight = 18;

    // Escribir el archivo en un buffer y devolverlo
    return await workbook.xlsx.writeBuffer();
  }

  private populateWorksheetWithGroupedClasses(
    worksheet: ExcelJS.Worksheet,
    groupedClasses: Record<
      string,
      Record<
        string,
        {
          language: string;
          registers: ClassRegisterData[];
          paymentMethods: Set<string>;
          currencies: {
            [currency: string]: {
              count: number;
              total: number;
            };
          };
        }
      >
    >
  ) {
    for (const date in groupedClasses) {
      // Añadir fecha como encabezado de sección
      const dateRow = worksheet.addRow([`Fecha: ${date}`]);
      dateRow.font = { bold: true, size: 14 };
      dateRow.height = 22;

      for (const schedule in groupedClasses[date]) {
        // Añadir horario como subencabezado
        const classes = groupedClasses[date][schedule];
        const scheduleRow = worksheet.addRow([
          `Horario: ${schedule} - Idioma: ${classes.language || 'No especificado'}`
        ]);
        scheduleRow.font = { bold: true, size: 12 };
        scheduleRow.height = 20;

        // Calcular totales para resumen
        let totalParticipants = 0;
        const totalsByCurrency = {};

        classes.registers.forEach((clase) => {
          totalParticipants += clase.totalParticipants || 0;
          if (clase.totalPrice && clase.typeCurrency) {
            if (!totalsByCurrency[clase.typeCurrency]) {
              totalsByCurrency[clase.typeCurrency] = 0;
            }
            totalsByCurrency[clase.typeCurrency] += clase.totalPrice;
          }
        });

        // Añadir resumen
        const summaryRow = worksheet.addRow(['Resumen:']);
        summaryRow.font = { bold: true, italic: true };

        worksheet.addRow([
          'Total Participantes:',
          totalParticipants,
          'Métodos de Pago:',
          Array.from(classes.paymentMethods).join(', ') || 'Ninguno'
        ]);

        // Añadir totales por moneda
        const currencyTotals = [];
        for (const currency in totalsByCurrency) {
          currencyTotals.push(`${currency}: ${totalsByCurrency[currency].toFixed(2)}`);
        }

        worksheet.addRow(['Totales:', currencyTotals.join(', ')]);
        worksheet.addRow([]);

        // Añadir encabezados de tabla
        const headerRow = worksheet.addRow([
          'Nombre',
          'Email',
          'Teléfono',
          'Adultos',
          'Niños',
          'Total',
          'Método',
          'Moneda',
          'Precio'
        ]);

        // Estilo para encabezados
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Añadir los detalles de cada registro
        classes.registers.forEach((clase) => {
          const row = worksheet.addRow([
            clase.userName || '--',
            clase.userEmail || '--',
            clase.userPhone || '--',
            clase.totalAdults || '--',
            clase.totalChildren || '--',
            clase.totalParticipants || '--',
            clase.methodPayment || '--',
            clase.typeCurrency || '--',
            clase.totalPrice || '--'
          ]);

          // Aplicar bordes a las celdas
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });

        // Añadir separador entre horarios
        worksheet.addRow([]);
        const separatorRow = worksheet.addRow(['']);
        separatorRow.height = 10;
      }
    }

    // Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column['eachCell']({ includeEmpty: true }, function (cell) {
        if (cell.value) {
          const cellLength = cell.value.toString().length;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }
      });
      column.width = Math.min(maxLength + 2, 40);
    });
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
      classesHtml += `<h3 style="margin: 10px 0 5px 0;">Fecha: ${date}</h3>`;

      for (const schedule in groupedClasses[date]) {
        classesHtml += `<h4 style="margin: 8px 0 5px 0;">Horario: ${schedule}</h4>`;

        // Resumen conciso antes de la tabla
        let totalParticipants = 0;
        const totalsByCurrency = {};

        groupedClasses[date][schedule].registers.forEach((clase) => {
          totalParticipants += clase.totalParticipants || 0;
          if (clase.totalPrice && clase.typeCurrency) {
            if (!totalsByCurrency[clase.typeCurrency]) {
              totalsByCurrency[clase.typeCurrency] = 0;
            }
            totalsByCurrency[clase.typeCurrency] += clase.totalPrice;
          }
        });

        // Resumen compacto
        classesHtml += '<div style="font-size: 12px; margin-bottom: 5px;">';
        classesHtml += `<strong>Total Participantes:</strong> ${totalParticipants} | `;
        classesHtml += `<strong>Métodos Pago:</strong> ${Array.from(groupedClasses[date][schedule].paymentMethods).join(', ') || 'Ninguno'} | `;

        // Totales por moneda en línea
        classesHtml += '<strong>Totales:</strong> ';
        const currencySummaries = [];
        for (const currency in totalsByCurrency) {
          currencySummaries.push(`${currency}: ${totalsByCurrency[currency].toFixed(2)}`);
        }
        classesHtml += currencySummaries.join(', ');
        classesHtml += '</div>';

        // Tabla más compacta
        classesHtml += '<div style="overflow-x:auto; margin: 0;">';
        classesHtml +=
          '<table border="1" style="width: 100%; border-collapse: collapse; font-size: 10px;">';
        classesHtml += `
      <thead>
        <tr style="background-color: #f2f2f2;">
        <th style="padding: 4px;">Nombre</th>
        <th style="padding: 4px;">Email</th>
        <th style="padding: 4px;">Teléfono</th>
        <th style="padding: 4px;">Adultos</th>
        <th style="padding: 4px;">Niños</th>
        <th style="padding: 4px;">Total</th>
        <th style="padding: 4px;">Método</th>
        <th style="padding: 4px;">Moneda</th>
        <th style="padding: 4px;">Precio</th>
        </tr>
      </thead>
      <tbody>
      `;

        groupedClasses[date][schedule].registers.forEach((clase) => {
          classesHtml += `
        <tr>
        <td style="padding: 3px; text-transform: capitalize;">${clase.userName ?? '--'}</td>
        <td style="padding: 3px; font-size: 9px;">${clase.userEmail ?? '--'}</td>
        <td style="padding: 3px;">${clase.userPhone ?? '--'}</td>
        <td style="padding: 3px; text-align: center;">${clase.totalAdults ?? '--'}</td>
        <td style="padding: 3px; text-align: center;">${clase.totalChildren ?? '--'}</td>
        <td style="padding: 3px; text-align: center;">${clase.totalParticipants ?? '--'}</td>
        <td style="padding: 3px;">${clase.methodPayment ?? '--'}</td>
        <td style="padding: 3px; text-align: center;">${clase.typeCurrency ?? '--'}</td>
        <td style="padding: 3px; text-align: right;">${clase.totalPrice ?? '--'}</td>
        </tr>
      `;
        });

        classesHtml += '</tbody></table>';
        classesHtml += '</div>';

        // Agregar espacio entre horarios
        classesHtml += '<hr style="margin: 10px 0; border: 0.5px solid #ddd;">';
      }
    }

    return classesHtml;
  }

  /**
   * Agrupar las clases por fecha y horario
   * @param data Datos de las clases
   * @returns Clases agrupadas por fecha y horario
   */
  private groupClassesByDateAndSchedule(data: ClassesDataAdmin[]): Record<
    string,
    Record<
      string,
      {
        language: string;
        registers: ClassRegisterData[];
        paymentMethods: Set<string>;
        currencies: {
          [currency: string]: {
            count: number;
            total: number;
          };
        };
      }
    >
  > {
    const groupedClasses: Record<
      string,
      Record<
        string,
        {
          language: string;
          registers: ClassRegisterData[];
          paymentMethods: Set<string>;
          currencies: {
            [currency: string]: {
              count: number;
              total: number;
            };
          };
        }
      >
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
          registers: [],
          paymentMethods: new Set<string>(),
          currencies: {}
        };
      }

      // Agregar los registros al grupo correspondiente
      classData.registers.forEach((register) => {
        groupedClasses[dateKey][scheduleKey].registers.push(register);

        // Add payment method if exists
        if (register.methodPayment) {
          groupedClasses[dateKey][scheduleKey].paymentMethods.add(register.methodPayment);
        }

        // Add currency and update totals
        if (register.typeCurrency) {
          if (!groupedClasses[dateKey][scheduleKey].currencies[register.typeCurrency]) {
            groupedClasses[dateKey][scheduleKey].currencies[register.typeCurrency] = {
              count: 0,
              total: 0
            };
          }
          groupedClasses[dateKey][scheduleKey].currencies[register.typeCurrency].count++;
          groupedClasses[dateKey][scheduleKey].currencies[register.typeCurrency].total +=
            register.totalPrice || 0;
        }
      });
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

    return classExists?.id || undefined;
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
    // Calculamos la fecha de hoy en la zona horaria de Lima
    const today = new Date();
    const formattedToday = formatInTimeZone(today, 'America/Lima', 'yyyy-MM-dd');
    const zonedToday = parseISO(formattedToday);
    zonedToday.setHours(0, 0, 0, 0);

    // Buscamos todas las clases cerradas en el rango de fechas
    const classesClosed = await this.prisma.classes.findMany({
      where: {
        scheduleClass: scheduleClass || undefined,
        typeClass: typeClass || 'NORMAL',
        dateClass: {
          gte: today
        }
      },
      select: {
        id: true,
        dateClass: true,
        scheduleClass: true,
        isClosed: true,
        totalParticipants: true
      }
    });

    // Creamos un array con las fechas de las clases cerradas
    const classes: ClassClosed[] = classesClosed.map((classClosed) => ({
      id: classClosed.id,
      dateClass: classClosed.dateClass,
      scheduleClass: classClosed.scheduleClass,
      isClosed: classClosed.isClosed,
      totalParticipants: classClosed.totalParticipants
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
      // Validar el formato de la fecha
      let parsedDate: Date;
      try {
        // Parsear la fecha
        const date = parseISO(dateClass);
        if (!date || isNaN(date.getTime())) {
          throw new Error('Fecha inválida');
        }
        // Formatear la fecha considerando la zona horaria de Lima
        const formattedDate = formatInTimeZone(date, 'America/Lima', 'yyyy-MM-dd');
        parsedDate = parseISO(formattedDate);
      } catch (error) {
        throw new BadRequestException(
          'El formato de la fecha es inválido. Use el formato ISO (YYYY-MM-DD)'
        );
      }

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
      const currentClass = await this.prisma.classes.findUnique({
        where: { id },
        select: { isClosed: true }
      });

      if (!currentClass) {
        throw new BadRequestException('La clase no existe');
      }

      const classClosed = await this.prisma.classes.update({
        where: { id },
        data: { isClosed: !currentClass.isClosed },
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
