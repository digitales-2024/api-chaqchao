import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth, GetUser } from '../auth/decorators';
import { CategoryData, HttpResponse, UserData } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Admin Categories')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'category',
  version: '1'
})
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Crea una nueva categoría.
   * @param createCategoryDto - El objeto de transferencia de datos que contiene detalles de categoría.
   * @param user - El usuario crea la categoría.
   * @returns Una promesa que se resuelve a la respuesta HTTP que contiene los datos de categoría creados.
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría' })
  @ApiCreatedResponse({ description: 'Categoría creada' })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Objeto de transferencia de datos que contiene detalles de categoría'
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.create(createCategoryDto, user);
  }

  /**
   * Obtiene una lista de todas las categorías.
   * @param user - El usuario solicitante.
   * @returns Una promesa que se resuelve en un array de datos de categoría.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  @ApiOkResponse({ description: 'Lista de categorías' })
  findAll(@GetUser() user: UserData): Promise<CategoryData[]> {
    return this.categoryService.findAll(user);
  }

  /**
   * Obtiene una categoría por su id.
   * @param id - Id de la categoría.
   * @returns Una promesa que se resuelve en los datos de la categoría.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por su id' })
  @ApiOkResponse({ description: 'Categoría encontrada' })
  @ApiParam({ name: 'id', description: 'Id de la categoría' })
  findOne(@Param('id') id: string): Promise<CategoryData> {
    return this.categoryService.findOne(id);
  }

  /**
   * Actualiza una categoría existente.
   * @param id - Id de la categoría a actualizar.
   * @param updateCategoryDto - El objeto de transferencia de datos que contiene los detalles de la categoría a actualizar.
   * @param user - El usuario crea la categoría.
   * @returns Una promesa que se resuelve a la respuesta HTTP que contiene los datos de la categoría actualizada.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría existente' })
  @ApiBody({
    type: UpdateCategoryDto,
    description:
      'Objeto de transferencia de datos que contiene los detalles de la categoría a actualizar'
  })
  @ApiParam({ name: 'id', description: 'Id de la categoría' })
  @ApiOkResponse({ description: 'Categoría actualizada' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  /**
   * Elimina una categoría existente.
   * @param id - Id de la categoría a eliminar.
   * @param user - El usuario que elimina la categoría.
   * @returns Una promesa que se resuelve en la respuesta HTTP que contiene los
   *          datos de la categoría eliminada.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría existente' })
  @ApiParam({ name: 'id', description: 'Id de la categoría' })
  @ApiOkResponse({ description: 'Categoría eliminada' })
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.remove(id, user);
  }

  /**
   * Reactiva una categoría existente.
   * @param id - Id de la categoría a reactivar.
   * @param user - El usuario que reactiva la categoría.
   * @returns Una promesa que se resuelve en la respuesta HTTP que contiene los
   *          datos de la categoría reactivada.
   */
  @Patch('reactivate/:id')
  @ApiOperation({ summary: 'Reactivar una categoría existente' })
  @ApiParam({ name: 'id', description: 'Id de la categoría' })
  @ApiOkResponse({ description: 'Categoría reactivada' })
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.reactivate(id, user);
  }

  /**
   * Desactiva una categoría existente.
   * @param id - Id de la categoría a desactivar.
   * @param user - El usuario que desactiva la categoría.
   * @returns Una promesa que se resuelve en la respuesta HTTP que contiene los
   *          datos de la categoría desactivada.
   */
  @Patch('desactivate/:id')
  @ApiOperation({ summary: 'Desactivar una categoría existente' })
  @ApiParam({ name: 'id', description: 'Id de la categoría' })
  @ApiOkResponse({ description: 'Categoría desactivada' })
  desactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.desactivate(id, user);
  }
}
