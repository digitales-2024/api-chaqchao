import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ClassesAdminService } from './classes-admin.service';
import { Auth, Module, Permission } from '../auth/decorators';
import { ClassesData, ClassesDataAdmin } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';

@ApiTags('Admin Classes')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('CLS')
@Controller({ path: '/class/admin', version: '1' })
export class ClassesAdminController {
  constructor(private readonly classesAdminService: ClassesAdminService) {}

  /**
   * Crear una clase desde el panel de administración
   * @param data Datos de la clase a crear
   * @returns Datos de la clase creada
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear una clase desde el panel de administración' })
  @ApiOkResponse({ description: 'Clase creada' })
  @ApiBody({ description: 'Datos de la clase a crear', type: CreateClassAdminDto })
  create(@Body() data: CreateClassAdminDto): Promise<ClassesData> {
    return this.classesAdminService.createClass(data);
  }

  /**
   * Mostrar todos los registros de clases por fecha
   * @param date Fecha de la clase
   * @returns Registros de clases por fecha
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todos los registros de clases por fecha' })
  @ApiOkResponse({ description: 'Registros de clases por fecha' })
  @ApiQuery({ name: 'date', description: 'Fecha de la clase', required: false })
  findByDate(@Query('date') date: string): Promise<ClassesDataAdmin[]> {
    return this.classesAdminService.findByDate(date);
  }

  /**
   * Exportar un archivo Excel con los registros de las clases
   * @param res Response de la petición
   * @param data Registros de las clases
   * @returns Archivo Excel
   */
  @Post('export/classes/excel')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar un archivo Excel con los registros de las clases' })
  @ApiOkResponse({ description: 'Descargar el archivo de Excel' })
  @ApiBody({ description: 'Registros de las clases' })
  async exportExcelClasses(@Res() res: Response, @Body() data: ClassesDataAdmin[]) {
    // Genera el archivo Excel usando el servicio
    const excelBuffer = await this.classesAdminService.generateExcelClasssesAdmin(data);

    // Configura los encabezados para la descarga del archivo Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Clases.xlsx');

    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }

  /**
   * Exportar un archivo PDF con los registros de las clases.
   * @param res - Objeto de respuesta de Express
   * @param data - Registros de las clases para incluir en el PDF
   * @returns Envío del archivo PDF como respuesta.
   */
  @Post('export/classes/pdf')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar un archivo PDF con los registros de las clases' })
  @ApiOkResponse({ description: 'Descargar el archivo PDF' })
  @ApiBody({ description: 'Registros de las clases' })
  async exportPdfClasses(@Res() res: Response, @Body() data: ClassesDataAdmin[]) {
    // Generar el PDF con Puppeteer usando los datos proporcionados
    const pdfBuffer = await this.classesAdminService.generatePDFClassReport(data);

    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="class_report.pdf"');
    res.send(pdfBuffer);
  }
}
