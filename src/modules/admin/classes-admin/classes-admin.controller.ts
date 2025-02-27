import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { TypeClass, TypeCurrency } from '@prisma/client';
import { Response } from 'express';
import { ClassesDataAdmin, ClassPriceConfigData, ClassRegisterData } from 'src/interfaces';
import { Auth, Module, Permission } from '../auth/decorators';
import { ClassCapacityService } from '../class-capacity/class-capacity.service';
import { ClassPriceService } from '../class-price/class-price.service';
import { ClassesAdminService } from './classes-admin.service';
import { CreateClassAdminDto } from './dto/create-class-admin.dto';

@ApiTags('Admin Classes')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('CLS')
@Controller({ path: '/class/admin', version: '1' })
export class ClassesAdminController {
  constructor(
    private readonly classesAdminService: ClassesAdminService,
    private readonly classCapacityService: ClassCapacityService,
    private readonly classPriceService: ClassPriceService
  ) {}

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
  create(@Body() data: CreateClassAdminDto): Promise<ClassRegisterData> {
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

  /**
   * Obtener todos los registros de clases futuras para un horario y tipo de clase
   * @param scheduleClass Horario de inicio de la clase
   * @param typeClass Tipo de clase
   * @returns Todos los registros de clases futuras
   */
  @Get('futures')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener todos los registros de clases futuras' })
  @ApiOkResponse({ description: 'Registros de clases futuras' })
  @ApiQuery({
    name: 'schedule',
    description: 'Horario de inicio de la clase para obtener las clases futuras',
    required: true
  })
  @ApiQuery({
    name: 'typeClass',
    description: 'Tipo de clase para obtener las clases futuras',
    required: false
  })
  async findAllFutureClasses(
    @Query('schedule') scheduleClass: string,
    @Query('typeClass') typeClass: TypeClass
  ) {
    return await this.classesAdminService.findAllFutureClasses(scheduleClass, typeClass);
  }

  /**
   * Verificar si hay una clase en una fecha y hora específica para un tipo de clase
   * @param scheduleClass - Horario de inicio de la clase
   * @param dateClass - Fecha de la clase
   * @param typeClass - Tipo de clase
   */
  @Get('check-class')
  @Permission(['READ'])
  @ApiOperation({
    summary: 'Verificar si hay una clase en una fecha y hora específica para un tipo de clase'
  })
  @ApiOkResponse({ description: 'Clase encontrada' })
  @ApiQuery({ name: 'schedule', description: 'Horario de inicio de la clase', required: true })
  @ApiQuery({ name: 'date', description: 'Fecha de la clase', required: true })
  @ApiQuery({ name: 'typeClass', description: 'Tipo de clase', required: true })
  async checkClass(
    @Query('schedule') scheduleClass: string,
    @Query('date') dateClass: string,
    @Query('typeClass') typeClass: TypeClass
  ) {
    return await this.classesAdminService.checkClass(scheduleClass, dateClass, typeClass);
  }

  /**
   * Cerrar una clase por su ID
   * @param classId - ID de la clase a cerrar
   * @returns Clase cerrada
   */
  @Patch('close/:classId')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Cerrar una clase por su ID' })
  @ApiOkResponse({ description: 'Clase cerrada' })
  @ApiParam({ name: 'classId', description: 'ID de la clase a cerrar', required: true })
  async closeClass(@Param('classId') classId: string) {
    return await this.classesAdminService.closeClass(classId);
  }

  /**
   * Obtener todos las capacidades de los tipos de clases
   * @returns Todas las capacidades de los tipos de clases
   */
  @Get('capacity')
  @ApiOperation({ summary: 'Obtener todas las capacidades de los tipos de clases' })
  @ApiOkResponse({ description: 'Capacidades de los tipos de clases' })
  @ApiQuery({
    name: 'typeClass',
    description: 'Tipo de clase para obtener las capacidades',
    enum: TypeClass,
    required: false
  })
  async findAllCapacities(@Query('typeClass') typeClass?: TypeClass) {
    return await this.classCapacityService.findAll(typeClass);
  }

  /**
   * Buscar todos los precios de las clases en dolares
   * @returns Promesa que se resuelve con los precios de las clases en dolares encontrados
   */
  @Get('/prices')
  @ApiOperation({ summary: 'Buscar precios por tipo de moneda y tipo de clase' })
  @ApiOkResponse({ description: 'Precios encontrados' })
  @ApiBadRequestResponse({ description: 'No hay precios disponibles' })
  @ApiQuery({
    name: 'typeCurrency',
    required: true,
    description: 'Tipo de moneda (SOLES/DOLARES)',
    enum: TypeCurrency
  })
  @ApiQuery({
    name: 'typeClass',
    required: true,
    description: 'Tipo de clase',
    enum: TypeClass
  })
  async findAllPricesToClass(
    @Query('typeCurrency') typeCurrency: TypeCurrency,
    @Query('typeClass') typeClass: TypeClass
  ): Promise<ClassPriceConfigData[]> {
    // Validar el tipo de moneda
    this.classPriceService.validateTypeCurrency(typeCurrency);

    // Validar que typeClass sea válido
    if (!Object.values(TypeClass).includes(typeClass)) {
      throw new BadRequestException(
        `Invalid typeClass value. Use one of: ${Object.values(TypeClass).join(', ')}`
      );
    }

    return this.classPriceService.findClassPriceByTypeCurrencyAndTypeClass(typeCurrency, typeClass);
  }
}
