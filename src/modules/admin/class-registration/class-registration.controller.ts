import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassRegistrationService } from './class-registration.service';
import { CreateClassRegistrationDto } from './dto/create-class-registration.dto';
import { UpdateClassRegistrationDto } from './dto/update-class-registration.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassRegistrationData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Settings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'class-registration',
  version: '1'
})
export class ClassRegistrationController {
  constructor(private readonly classRegistrationService: ClassRegistrationService) {}

  /**
   * Crear un registro de clase
   * @param createClassRegistrationDto Datos para el registro de clase
   * @param user Usuario que crea el registro de clase
   * @returns Registro de clase creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un registro de clase' })
  @ApiOkResponse({ description: 'Registro de clase creado' })
  @ApiBody({
    type: CreateClassRegistrationDto,
    description: 'Datos para crear un registro de clase'
  })
  create(
    @Body() createClassRegistrationDto: CreateClassRegistrationDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    return this.classRegistrationService.create(createClassRegistrationDto, user);
  }

  /**
   * Mostrar todos los registros de clase
   * @returns Todos los registros de clase
   */
  @Get()
  @ApiOperation({ summary: 'Mostrar todos los registros de clase' })
  @ApiOkResponse({ description: 'Obtenga todos los registros de clase' })
  findAll(): Promise<ClassRegistrationData[]> {
    return this.classRegistrationService.findAll();
  }

  /**
   * Obtener un registro de clase por Id
   * @param id Id del registro de clase
   * @returns Registro de clase
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro de clase por Id' })
  @ApiOkResponse({ description: 'Obtener registro de clase' })
  @ApiParam({ name: 'id', description: 'Id del registro de clase' })
  findOne(@Param('id') id: string): Promise<ClassRegistrationData> {
    return this.classRegistrationService.findOne(id);
  }

  /**
   * Actualizar un registro de clase
   * @param id Id del registro de clase a actualizar
   * @param updateClassRegistrationDto Datos para actualizar el registro de clase
   * @param user Usuario que realiza la actualización
   * @returns Registro de clase actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro de clase' })
  @ApiOkResponse({ description: 'Registro de clase actualizado' })
  @ApiParam({ name: 'id', description: 'Id del registro de clase' })
  @ApiBody({
    type: UpdateClassRegistrationDto,
    description: 'Datos para actualizar el registro de clase'
  })
  update(
    @Param('id') id: string,
    @Body() updateClassRegistrationDto: UpdateClassRegistrationDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    return this.classRegistrationService.update(id, updateClassRegistrationDto, user);
  }

  /**
   * Eliminar un registro de clase
   * @param id Id del registro de clase a eliminar
   * @param user Usuario que elimina el registro de clase
   * @returns Registro de clase eliminado
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un registro de clase' })
  @ApiOkResponse({ description: 'Registro de clase eliminado' })
  @ApiParam({ name: 'id', description: 'Id del registro de clase' })
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    return this.classRegistrationService.remove(id, user);
  }
}
