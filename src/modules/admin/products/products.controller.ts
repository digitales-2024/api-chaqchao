import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, ProductData, UserData, UserPayload } from 'src/interfaces';
import { Auth, GetUser, Module, Permission } from '../auth/decorators';
import { CreateProductDto } from './dto/create-product.dto';
import { DeleteProductsDto } from './dto/delete-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Admin Products')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Module('PRD')
@Controller({
  path: 'products',
  version: '1'
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Crear un nuevo producto
   * @param createProductDto Informacion del producto a crear
   * @param user Usuario que crea el producto
   * @returns Informacion del producto creado
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiCreatedResponse({ description: 'Producto creado' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 3))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    const product = await this.productsService.create(createProductDto, images, user);

    return product;
  }

  /**
   * Mostrar todos los productos
   * @param user Usuario que lista los productos
   * @returns Todos los productos
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todos los productos' })
  @ApiOkResponse({ description: 'Obtener todos los productos' })
  findAll(@GetUser() user: UserPayload): Promise<ProductData[]> {
    return this.productsService.findAll(user);
  }

  /**
   * Mostrar producto por id
   * @param id Id del producto
   * @returns Informacion del producto
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar producto por id' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiOkResponse({ description: 'Obtener producto por identificación' })
  findOne(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
  }

  /**
   * Actualizar el producto por id
   * @param id Id del producto
   * @param updateProductDto Datos del producto a actualizar
   * @param images Nuevas imágenes a agregar (opcional)
   * @param user Usuario que actualiza el producto
   * @returns Información del producto actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar el producto por id' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductDto, description: 'Datos del producto a actualizar' })
  @ApiOkResponse({ description: 'Producto actualizado' })
  @UseInterceptors(FilesInterceptor('images', 3))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return await this.productsService.update(id, updateProductDto, images, user);
  }

  /**
   * Eliminar un producto
   * @param id Id del producto
   * @param user Usuario que elimina el producto
   * @returns Información del producto eliminado
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiOkResponse({ description: 'Producto eliminado' })
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<ProductData>> {
    return this.productsService.remove(id, user);
  }

  /**
   * Eliminar permanente un producto
   * @param id Id del producto
   * @returns Información del producto eliminado
   */
  @Delete('permanent/:id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar permanentemente un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiOkResponse({ description: 'Producto eliminado permanentemente' })
  removePermanent(@Param('id') id: string): Promise<void> {
    return this.productsService.removePermanent(id);
  }

  /**
   * Desactivar varios productos
   * @param products Arreglo de identificadores de los productos a desactivar
   * @param user Usuario que desactiva los productos
   * @returns Mensaje de desactivación correcta
   */
  @Delete('remove/all')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Desactivar varios productos' })
  @ApiBody({
    type: DeleteProductsDto,
    description: 'Arreglo de identificadores de los productos a desactivar'
  })
  @ApiOkResponse({ description: 'Productos desactivados' })
  deactivate(
    @Body() products: DeleteProductsDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.productsService.removeAll(products, user);
  }

  /**
   * Alternar el estado de activación de un producto por identificación
   * @param id ID del producto
   * @param user Usuario que realiza la activación alternativa
   * @returns Datos de producto actualizados con estado de activación alternado
   */
  @Patch('toggleactivation/:id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Alternar el estado de activación de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiOkResponse({ description: 'Producto actualizado' })
  toggleActivation(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.toggleActivation(id, user);
  }

  /**
   * Reactivate multiple products
   * @param user User performing the reactivation
   * @param products List of product identifiers to reactivate
   * @returns Confirmation message of successful reactivation
   */
  @Patch('reactivate/all')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Reactivar varios productos' })
  @ApiBody({
    type: DeleteProductsDto,
    description: 'Lista de identificadores de productos a reactivar'
  })
  @ApiOkResponse({ description: 'Productos reactivados' })
  reactivateAll(@GetUser() user: UserData, @Body() products: DeleteProductsDto) {
    return this.productsService.reactivateAll(user, products);
  }

  /**
   * Reactivar un producto por identificación
   * @param id ID del producto
   * @param user Usuario que reactiva el producto
   * @returns Datos de producto actualizados con estado de activación reactivado
   */
  @Patch('reactivate/:id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Reactivar un producto por id' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiOkResponse({ description: 'Producto reactivado' })
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.reactivate(id, user);
  }
}
