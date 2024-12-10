import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth, GetUser } from '../auth/decorators';
import { HttpResponse, ProductData, UserData, UserPayload } from 'src/interfaces';
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
import { DeleteProductsDto } from './dto/delete-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Admin Products')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
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
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiCreatedResponse({ description: 'Producto creado' })
  @ApiBody({ type: CreateProductDto, description: 'Informacion del producto a crear' })
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.create(createProductDto, user);
  }

  /**
   * Mostrar todos los productos
   * @param user Usuario que lista los productos
   * @returns Todos los productos
   */
  @Get()
  @ApiOperation({ summary: 'Mostrar todos los productos' })
  @ApiOkResponse({ description: 'Obtener todos los productos' })
  findAll(@GetUser() user: UserPayload): Promise<ProductData[]> {
    return this.productsService.findAll(user);
  }

  /**
   * Subir una imagen
   * @param image Imagen a subir
   * @returns URL de la imagen
   */
  @Post('upload/image')
  @ApiOperation({ summary: 'Subir una imagen' })
  @ApiCreatedResponse({ description: 'Imagen cargado' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() image: Express.Multer.File): Promise<HttpResponse<string>> {
    return this.productsService.uploadImage(image);
  }

  /**
   * Actualizar una imagen existente
   * @param image Imagen nueva para reemplazar la existente
   * @param existingFileName Nombre del archivo existente a actualizar
   * @returns URL de la imagen actualizada
   */
  @Patch('update/image/:existingFileName')
  @ApiOperation({ summary: 'Actualizar imagen' })
  @ApiCreatedResponse({ description: 'Image updated' })
  @UseInterceptors(FileInterceptor('image'))
  async updateImage(
    @UploadedFile() image: Express.Multer.File,
    @Param('existingFileName') existingFileName: string
  ): Promise<HttpResponse<string>> {
    return this.productsService.updateImage(image, existingFileName);
  }

  /**
   * Mostrar producto por id
   * @param id Id del producto
   * @returns Informacion del producto
   */
  @Get(':id')
  @ApiOperation({ summary: 'Mostrar producto por id' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiOkResponse({ description: 'Obtener producto por identificación' })
  findOne(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
  }

  /**
   * Actualizar el producto por id
   * @param id Id del producto
   * @param UpdateProductDto Datos del producto a actualizar
   * @param user Usuario que actualiza el producto
   * @returns Información del producto actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar el producto por id' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiBody({ type: UpdateProductDto, description: 'Datos del producto a actualizar' })
  @ApiOkResponse({ description: 'Producto actualizado' })
  update(
    @Param('id') id: string,
    @Body() UpdateProductDto: UpdateProductDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.update(id, UpdateProductDto, user);
  }

  /**
   * Eliminar un producto
   * @param id Id del producto
   * @param user Usuario que elimina el producto
   * @returns Información del producto eliminado
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'Id del producto' })
  @ApiOkResponse({ description: 'Producto eliminado' })
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<ProductData>> {
    return this.productsService.remove(id, user);
  }

  /**
   * Desactivar varios productos
   * @param products Arreglo de identificadores de los productos a desactivar
   * @param user Usuario que desactiva los productos
   * @returns Mensaje de desactivación correcta
   */
  @Delete('remove/all')
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
