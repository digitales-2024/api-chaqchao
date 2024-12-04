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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
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

@ApiTags('Shop Class')
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
   *  Crear un registro para una clases
   */
  @Post()
  @ApiOperation({ summary: 'Crear un registro para una clases' })
  @ApiCreatedResponse({ description: 'Registro creado' })
  create(@Body() createClassDto: CreateClassDto): Promise<HttpResponse<ClassesData>> {
    return this.classesService.create(createClassDto);
  }

  /**
   * Buscar clases por cliente
   */
  @Get('/client')
  @ApiOperation({ summary: 'Buscar clases por cliente' })
  @ApiOkResponse({ description: 'Class found' })
  @ApiBadRequestResponse({ description: 'Not found class' })
  @ClientAuth()
  findByClient(@GetClient() client: ClientData): Promise<ClassesData[]> {
    return this.classesService.findByClient(client);
  }

  /**
   * Buscar todas las clases
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
   */
  @Get('/languages')
  @ApiOperation({ summary: 'Buscar todos los idiomas' })
  @ApiOkResponse({ description: 'Idiomas encontrados' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase de idioma' })
  findAllLanguages(): Promise<ClassLanguageData[]> {
    return this.classLanguageService.findAll();
  }

  /**
   * Buscar todos los precios de dolares
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
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Confirmar una clase por id' })
  @ApiOkResponse({ description: 'Clase confirmada' })
  @ApiBadRequestResponse({ description: 'No confirmar clase' })
  confirmClass(
    @Param('id') id: string,
    @Body() classDto: UpdateClassDto
  ): Promise<HttpResponse<ClassesData>> {
    return this.classesService.confirmClass(id, classDto);
  }

  /**
   * Verificar si hay una clase una fecha y hora
   */
  @Post('/check')
  @ApiOperation({ summary: 'Verificar si hay una clase una fecha y hora' })
  @ApiOkResponse({ description: 'Clase encontrada' })
  @ApiBadRequestResponse({ description: 'No se encuentra clase' })
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
