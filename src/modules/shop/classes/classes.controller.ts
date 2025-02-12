import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { TypeClass, TypeCurrency } from '@prisma/client';
import {
  ClassesDataAdmin,
  ClassLanguageData,
  ClassPriceConfigData,
  ClassRegisterData,
  ClassScheduleData,
  ClientData,
  HttpResponse
} from 'src/interfaces';
import { ClassCapacityService } from 'src/modules/admin/class-capacity/class-capacity.service';
import { ClassLanguageService } from 'src/modules/admin/class-language/class-language.service';
import { ClassPriceService } from 'src/modules/admin/class-price/class-price.service';
import { ClassRegistrationService } from 'src/modules/admin/class-registration/class-registration.service';
import { ClassScheduleService } from 'src/modules/admin/class-schedule/class-schedule.service';
import { ClassesAdminService } from 'src/modules/admin/classes-admin/classes-admin.service';
import { CreateClassAdminDto } from 'src/modules/admin/classes-admin/dto/create-class-admin.dto';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { GetClient } from '../auth/decorators/get-client.decorator';
import { ClassesService } from './classes.service';
import { UpdateClassDto } from './dto/update-class.dto';

@ApiTags('Shop Classes')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'classes',
  version: '1'
})
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classScheduleService: ClassScheduleService,
    private readonly classLanguageService: ClassLanguageService,
    private readonly classPriceService: ClassPriceService,
    private readonly classesAdminService: ClassesAdminService,
    private readonly classCapacityService: ClassCapacityService,
    private readonly classRegistrationService: ClassRegistrationService
  ) {}

  /**
   * Crear una clase desde el panel de administración
   * @param data Datos de la clase a crear
   * @returns Datos de la clase creada
   */
  @Post()
  @ApiOperation({ summary: 'Crear una clase desde el panel de administración' })
  @ApiOkResponse({ description: 'Clase creada' })
  @ApiBody({ description: 'Datos de la clase a crear', type: CreateClassAdminDto })
  create(@Body() data: CreateClassAdminDto): Promise<ClassRegisterData> {
    return this.classesAdminService.createClass(data);
  }

  /**
   * Buscar todas las clases del cliente
   * @param client - Información del cliente
   * @returns Promesa que se resuelve con los datos de las clases encontradas
   */
  @Get('/client')
  @ApiOperation({ summary: 'Buscar clases por cliente' })
  @ApiOkResponse({ description: 'Clase encontrada' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase' })
  @ClientAuth()
  findByClient(@GetClient() client: ClientData): Promise<ClassRegisterData[]> {
    return this.classesService.findByClient(client);
  }

  /**
   * Buscar todos los horarios de las clases
   * @returns Promesa que se resuelve con los horarios de las clases encontrados
   */
  @Get()
  @ApiOperation({ summary: 'Buscar todas las clases' })
  @ApiOkResponse({ description: 'Clases encontradas' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase' })
  findAll(): Promise<ClassScheduleData[]> {
    return this.classScheduleService.findAll();
  }

  /**
   * Buscar todos los idiomas
   * @returns Promesa que se resuelve con los idiomas encontrados
   */
  @Get('/languages')
  @ApiOperation({ summary: 'Buscar todos los idiomas' })
  @ApiOkResponse({ description: 'Idiomas encontrados' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase de idioma' })
  findAllLanguages(): Promise<ClassLanguageData[]> {
    return this.classLanguageService.findAll();
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

  /**
   * Confirmar una clase por id
   * @param id Id de la clase
   * @param classDto Data de la clase a confirmar
   * @returns Promesa que se resuelve con la clase confirmada
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Confirmar una clase por id' })
  @ApiOkResponse({ description: 'Clase confirmada' })
  @ApiBadRequestResponse({ description: 'No confirmar clase' })
  @ApiParam({ name: 'id', required: true, description: 'Id de la clase' })
  confirmClass(
    @Param('id') id: string,
    @Body() classDto: UpdateClassDto
  ): Promise<HttpResponse<void>> {
    return this.classesService.confirmClass(id, classDto);
  }

  /**
   * Verifica si hay una clase en una fecha y hora específicas.
   *
   * @param scheduleClass Horario de inicio de la clase.
   * @param dateClass Fecha de la clase.
   * @returns Promesa que se resuelve con los datos de la clase encontrada.
   * @throws BadRequestException Si falta la fecha o el horario, o si el formato de la fecha o el horario es inválido.
   */
  @Post('/check')
  @ApiOperation({ summary: 'Verificar si hay una clase una fecha y hora' })
  @ApiOkResponse({ description: 'Clase encontrada' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase' })
  @ApiQuery({ name: 'schedule', required: true, description: 'Horario de inicio de la clase' })
  @ApiQuery({ name: 'date', required: true, description: 'Fecha de la clase' })
  checkClass(
    @Query('schedule') scheduleClass: string,
    @Query('date') dateClass: string,
    @Query('typeClass') typeClass: TypeClass
  ): Promise<ClassesDataAdmin> {
    try {
      if (!scheduleClass || !dateClass) {
        throw new BadRequestException('Date and schedule are required');
      }

      return this.classesService.checkClass(scheduleClass, dateClass, typeClass);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Mostrar todos los horarios de clases
   * @summary Mostrar todos los horarios de clases
   * @returns Todos los horarios de clases
   */
  @Get('/schedule')
  @ApiOperation({ summary: 'Mostrar todos los horarios de clases' })
  @ApiOkResponse({ description: 'Todos los horarios de clases' })
  findAllSchedule(): Promise<ClassScheduleData[]> {
    return this.classScheduleService.findAll();
  }

  /**
   * Obtener todos los registros de clases futuras para un horario y tipo de clase
   * @param scheduleClass Horario de inicio de la clase
   * @param typeClass Tipo de clase
   * @returns Todos los registros de clases futuras
   */
  @Get('futures')
  @ApiOperation({ summary: 'Obtener todos los registros de clases futuras' })
  @ApiOkResponse({ description: 'Registros de clases futuras' })
  @ApiQuery({
    name: 'schedule',
    description: 'Horario de inicio de la clase para obtener las clases futuras',
    required: false
  })
  @ApiQuery({
    name: 'typeClass',
    description: 'Tipo de clase para obtener las clases futuras',
    required: false
  })
  async findAllFutureClasses(@Query('typeClass') typeClass: TypeClass) {
    return await this.classesAdminService.findAllFutureClasses('', typeClass);
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
   * Eliminar un registro de una clase
   * @param id Id del registro de la clase
   *
   */
  @Delete(':id/delete')
  @ApiOperation({ summary: 'Eliminar un registro de una clase' })
  @ApiOkResponse({ description: 'Registro de clase eliminado' })
  @ApiBadRequestResponse({ description: 'No se puede eliminar el registro de la clase' })
  @ApiParam({ name: 'id', required: true, description: 'Id del registro de la clase' })
  async deleteClass(@Param('id') id: string) {
    return await this.classesService.deleteClass(id);
  }

  /**
   * Mostrar los registros de tiempos para el cierre de clases
   * @returns Registros de tiempos para el cierre de clases
   */
  @Get('close-time')
  @ApiOperation({ summary: 'Mostrar los registros de tiempos para el cierre de clases' })
  @ApiOkResponse({ description: 'Registros de tiempos para el cierre de clases' })
  async findAllCloseTime() {
    const data = await this.classRegistrationService.findAll();
    return data[0];
  }
}
