import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassLanguageService } from './class-language.service';
import { CreateClassLanguageDto } from './dto/create-class-language.dto';
import { UpdateClassLanguageDto } from './dto/update-class-language.dto';
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
import { ClassLanguageData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Settings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'class-language', version: '1' })
export class ClassLanguageController {
  constructor(private readonly classLanguageService: ClassLanguageService) {}

  /**
   * Crear un nuevo lenguaje de clase
   * @param createClassLanguageDto Datos para el nuevo lenguaje de clase
   * @param user El usuario crea el idioma de clase
   * @returns El idioma de clase creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo lenguaje de clase' })
  @ApiOkResponse({ description: 'Lenguaje de clase creado' })
  @ApiBody({ type: CreateClassLanguageDto, description: 'Datos para el nuevo lenguaje de clase' })
  create(
    @Body() createClassLanguageDto: CreateClassLanguageDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    return this.classLanguageService.create(createClassLanguageDto, user);
  }

  /**
   * Obtener todos los lenguajes de clase
   * @returns Un listado de lenguajes de clase
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los lenguajes de clase' })
  @ApiOkResponse({ description: 'Get all class languages' })
  findAll(): Promise<ClassLanguageData[]> {
    return this.classLanguageService.findAll();
  }

  /**
   * Obtener un lenguaje de clase por su id
   * @param id El id del lenguaje de clase a obtener
   * @returns El lenguaje de clase encontrado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un lenguaje de clase por su id' })
  @ApiOkResponse({ description: 'Get class language by id' })
  @ApiParam({ name: 'id', description: 'El id del lenguaje de clase a obtener' })
  findOne(@Param('id') id: string): Promise<ClassLanguageData> {
    return this.classLanguageService.findOne(id);
  }

  /**
   * Actualizar un lenguaje de clase
   * @param id El id del lenguaje de clase a actualizar
   * @param updateClassLanguageDto Datos para actualizar el lenguaje de clase
   * @param user El usuario que actualiza el lenguaje de clase
   * @returns El lenguaje de clase actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un lenguaje de clase' })
  @ApiOkResponse({ description: 'Idioma de clase actualizado' })
  @ApiParam({ name: 'id', description: 'El id del lenguaje de clase a actualizar' })
  @ApiBody({
    type: UpdateClassLanguageDto,
    description: 'Datos para actualizar el lenguaje de clase'
  })
  update(
    @Param('id') id: string,
    @Body() updateClassLanguageDto: UpdateClassLanguageDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    return this.classLanguageService.update(id, updateClassLanguageDto, user);
  }

  /**
   * Eliminar un lenguaje de clase
   * @param id El id del lenguaje de clase a eliminar
   * @param user El usuario que elimina el lenguaje de clase
   * @returns El lenguaje de clase eliminado
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un lenguaje de clase' })
  @ApiOkResponse({ description: 'Lenguaje de clase eliminado' })
  @ApiParam({ name: 'id', description: 'El id del lenguaje de clase a eliminar' })
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    return this.classLanguageService.remove(id, user);
  }
}
