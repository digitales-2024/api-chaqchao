import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassCapacityService } from './class-capacity.service';
import { CreateClassCapacityDto } from './dto/create-class-capacity.dto';
import { UpdateClassCapacityDto } from './dto/update-class-capacity.dto';
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
import { UserData } from 'src/interfaces';

@ApiTags('Admin Settings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('STG')
@Controller({ path: 'class-capacity', version: '1' })
export class ClassCapacityController {
  constructor(private readonly classCapacityService: ClassCapacityService) {}

  /**
   * Crear una nueva capacidad según el tipo de clase
   * @param createClassCapacityDto Data para crear una nueva capacidad
   * @returns Capacidad creada
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear una nueva capacidad' })
  @ApiOkResponse({ description: 'Capacidad creada' })
  @ApiBody({ type: CreateClassCapacityDto, description: 'Data para crear una nueva capacidad' })
  create(@Body() createClassCapacityDto: CreateClassCapacityDto, @GetUser() user: UserData) {
    return this.classCapacityService.create(createClassCapacityDto, user);
  }

  /**
   * Obtener todas las capacidades de clase
   * @returns Todas las capacidades de clase
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener todas las capacidades de clase' })
  @ApiOkResponse({ description: 'Todas las capacidades de clase' })
  findAll() {
    return this.classCapacityService.findAll();
  }

  /**
   * Obtener una capacidad de clase por su ID
   * @param id ID de la capacidad de clase
   * @returns La capacidad de clase encontrada
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener una capacidad de clase' })
  @ApiOkResponse({ description: 'Capacidad de clase encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la capacidad de clase', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.classCapacityService.findOne(id);
  }

  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar una capacidad' })
  @ApiOkResponse({ description: 'Capacidad actualizada' })
  @ApiBody({ type: UpdateClassCapacityDto, description: 'Data para actualizar una capacidad' })
  @ApiParam({ name: 'id', description: 'ID de la capacidad', type: 'string' })
  update(
    @Param('id') id: string,
    @Body() updateClassCapacityDto: UpdateClassCapacityDto,
    @GetUser() user: UserData
  ) {
    return this.classCapacityService.update(id, updateClassCapacityDto, user);
  }

  /**
   * Eliminar una capacidad de clase
   * @param id ID de la capacidad de clase
   * @returns La capacidad de clase eliminada
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar una capacidad de clase' })
  @ApiOkResponse({ description: 'Capacidad de clase eliminada' })
  @ApiParam({ name: 'id', description: 'ID de la capacidad de clase', type: 'string' })
  remove(@Param('id') id: string, @GetUser() user: UserData) {
    return this.classCapacityService.remove(id, user);
  }
}
