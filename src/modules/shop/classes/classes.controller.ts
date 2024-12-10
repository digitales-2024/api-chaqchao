import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  BadRequestException
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import {
  ClassesData,
  ClassesDataAdmin,
  ClassLanguageData,
  ClassPriceConfigData,
  ClassScheduleData,
  ClientData,
  HttpResponse
} from 'src/interfaces';
import { ClassScheduleService } from 'src/modules/admin/class-schedule/class-schedule.service';
import { ClassLanguageService } from 'src/modules/admin/class-language/class-language.service';
import { ClassPriceService } from 'src/modules/admin/class-price/class-price.service';
import { GetClient } from '../auth/decorators/get-client.decorator';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
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
    private readonly classPriceService: ClassPriceService
  ) {}

  /**
   * Create a new class record.
   * @param createClassDto - Data transfer object containing information to create a class.
   * @returns A promise that resolves to the HTTP response containing the created class data.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un registro para una clases' })
  @ApiCreatedResponse({ description: 'Registro creado' })
  @ApiBody({ type: CreateClassDto, description: 'Información de la clase' })
  create(@Body() createClassDto: CreateClassDto): Promise<HttpResponse<ClassesData>> {
    return this.classesService.create(createClassDto);
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
  findByClient(@GetClient() client: ClientData): Promise<ClassesData[]> {
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
  @Get('/prices/dolar')
  @ApiOperation({ summary: 'Buscar todos los precios de dolares' })
  @ApiOkResponse({ description: 'Precios encontrados' })
  @ApiBadRequestResponse({ description: 'No clase de precios' })
  findAllPricesDolar(): Promise<ClassPriceConfigData[]> {
    return this.classPriceService.findClassPriceByTypeCurrency('DOLAR');
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
    @Query('date') dateClass: string
  ): Promise<ClassesDataAdmin> {
    try {
      if (!scheduleClass || !dateClass) {
        throw new BadRequestException('Date and time are required');
      }

      const dateTime = new Date(dateClass);

      if (isNaN(dateTime.getTime())) {
        throw new BadRequestException('Invalid date or time format');
      }
      return this.classesService.checkClass(scheduleClass, dateClass);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
