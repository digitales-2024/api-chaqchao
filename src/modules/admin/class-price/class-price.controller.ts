import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassPriceService } from './class-price.service';
import { CreateClassPriceDto } from './dto/create-class-price.dto';
import { UpdateClassPriceDto } from './dto/update-class-price.dto';
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
import { ClassPriceConfigData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Settings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('STG')
@Controller({ path: 'class-price', version: '1' })
export class ClassPriceController {
  constructor(private readonly classPriceService: ClassPriceService) {}

  /**
   * Crear un precio de clase
   * @param createClassPriceDto datosParaCrearUnPrecioDeClase
   * @param user Usuario que crea el precio de clase
   * @returns Precio de clase creado
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear un precio de clase' })
  @ApiOkResponse({ description: 'Precio de clase creado' })
  @ApiBody({ type: CreateClassPriceDto, description: 'Datos para crear un precio de clase' })
  create(
    @Body() createClassPriceDto: CreateClassPriceDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.create(createClassPriceDto, user);
  }

  /**
   * Obtener todos los precios de clase
   * @returns Todos los precios de clase
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener todos los precios de clase' })
  @ApiOkResponse({ description: 'Todos los precios de clase' })
  findAll(): Promise<ClassPriceConfigData[]> {
    return this.classPriceService.findAll();
  }

  /**
   * Obtener un precio de clase por su id
   * @param id Id del precio de clase
   * @returns Precio de clase encontrado
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener un precio de clase por su id' })
  @ApiOkResponse({ description: 'Precio de clase encontrado' })
  @ApiParam({ name: 'id', description: 'Id del precio de clase' })
  findOne(@Param('id') id: string): Promise<ClassPriceConfigData> {
    return this.classPriceService.findOne(id);
  }

  /**
   * Actualizar un precio de clase
   * @param id Id del precio de clase
   * @param updateClassPriceDto datosParaActualizarUnPrecioDeClase
   * @param user Usuario que actualiza el precio de clase
   * @returns Precio de clase actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar un precio de clase' })
  @ApiOkResponse({ description: 'Precio de clase actualizado' })
  @ApiParam({ name: 'id', description: 'Id del precio de clase' })
  @ApiBody({ type: UpdateClassPriceDto, description: 'Datos para actualizar un precio de clase' })
  update(
    @Param('id') id: string,
    @Body() updateClassPriceDto: UpdateClassPriceDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.update(id, updateClassPriceDto, user);
  }

  /**
   * Eliminar un precio de clase
   * @param id Id del precio de clase
   * @param user Usuario que elimina el precio de clase
   * @returns Precio de clase eliminado
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar un precio de clase' })
  @ApiOkResponse({ description: 'Precio de clase eliminado' })
  @ApiParam({ name: 'id', description: 'Id del precio de clase' })
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.remove(id, user);
  }
}
