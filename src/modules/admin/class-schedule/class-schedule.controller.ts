import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassScheduleService } from './class-schedule.service';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser, Module, Permission } from '../auth/decorators';
import { ClassScheduleData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Settings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('STG')
@Controller({
  path: 'class-schedule',
  version: '1'
})
export class ClassScheduleController {
  constructor(private readonly classScheduleService: ClassScheduleService) {}
  /**
   * Crear un nuevo horario de clases
   * @summary Crear un nuevo horario de clases
   * @param createClassScheduleDto Datos para el nuevo horario de clases
   * @param user Usuario que está creando el horario de clases
   * @returns El horario de clases creado con su identificación
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear un nuevo horario de clases' })
  @ApiOkResponse({ description: 'Horario de clases creado' })
  @ApiBody({ type: CreateClassScheduleDto, description: 'Datos para crear un horario de clases' })
  create(
    @Body() createClassScheduleDto: CreateClassScheduleDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.create(createClassScheduleDto, user);
  }

  /**
   * Mostrar todos los horarios de clases
   * @summary Mostrar todos los horarios de clases
   * @returns Todos los horarios de clases
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todos los horarios de clases' })
  @ApiOkResponse({ description: 'Todos los horarios de clases' })
  findAll(): Promise<ClassScheduleData[]> {
    return this.classScheduleService.findAll();
  }

  /**
   * Mostrar un horario de clases por su identificación
   * @summary Mostrar un horario de clases por su identificación
   * @param id Identificación del horario de clases
   * @returns El horario de clases encontrado
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar un horario de clases por su identificación' })
  @ApiOkResponse({ description: 'Horario de clases encontrado' })
  @ApiParam({ name: 'id', description: 'Identificación del horario de clases' })
  findOne(@Param('id') id: string): Promise<ClassScheduleData> {
    return this.classScheduleService.findOne(id);
  }

  /**
   * Actualizar un horario de clases
   * @summary Actualizar un horario de clases
   * @param id Identificación del horario de clases
   * @param updateClassScheduleDto Datos para actualizar el horario de clases
   * @returns El horario de clases actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar un horario de clases' })
  @ApiOkResponse({ description: 'Horario de clases actualizado' })
  @ApiParam({ name: 'id', description: 'Identificación del horario de clases' })
  @ApiBody({
    type: UpdateClassScheduleDto,
    description: 'Datos para actualizar el horario de clases'
  })
  update(
    @Param('id') id: string,
    @Body() updateClassScheduleDto: UpdateClassScheduleDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.update(id, updateClassScheduleDto, user);
  }

  /**
   * Eliminar un horario de clases
   * @summary Eliminar un horario de clases
   * @param id Identificación del horario de clases
   * @param user Usuario que está eliminando el horario de clases
   * @returns El horario de clases eliminado
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar un horario de clases' })
  @ApiOkResponse({ description: 'Horario de clases eliminado' })
  @ApiParam({ name: 'id', description: 'Identificación del horario de clases' })
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.remove(id, user);
  }
}
