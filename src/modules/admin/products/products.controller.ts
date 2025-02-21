import {
  BadRequestException,
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
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todos los productos' })
  @ApiOkResponse({ description: 'Obtener todos los productos' })
  findAll(@GetUser() user: UserPayload): Promise<ProductData[]> {
    return this.productsService.findAll(user);
  }

  /**
   * Subir imágenes para un producto
   * @param productId ID del producto
   * @param images Array de imágenes a subir (máximo 3)
   * @returns URLs de las imágenes subidas
   */
  @Post(':productId/images')
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Subir imágenes para un producto (máximo 3)' })
  @ApiCreatedResponse({ description: 'Imágenes subidas correctamente' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 3))
  async uploadImages(
    @Param('productId') productId: string,
    @UploadedFiles() images: Express.Multer.File[]
  ): Promise<HttpResponse<string[]>> {
    if (!images || images.length === 0) {
      throw new BadRequestException('No se proporcionaron imágenes');
    }
    if (images.length > 3) {
      throw new BadRequestException('No se pueden subir más de 3 imágenes por producto');
    }
    return this.productsService.uploadImages(productId, images);
  }

  /**
   * Actualizar una imagen específica del producto
   * @param productId ID del producto
   * @param imageId ID de la imagen
   * @param image Nueva imagen
   * @returns URL de la imagen actualizada
   */
  @Patch(':productId/images/:imageId')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar una imagen específica del producto' })
  @ApiCreatedResponse({ description: 'Imagen actualizada' })
  @UseInterceptors(FilesInterceptor('image', 1))
  async updateProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @UploadedFiles() [image]: Express.Multer.File[]
  ): Promise<HttpResponse<string>> {
    if (!image) {
      throw new BadRequestException('No se proporcionó una imagen');
    }
    return this.productsService.updateProductImage(productId, imageId, image);
  }

  /**
   * Eliminar una imagen específica del producto
   * @param productId ID del producto
   * @param imageId ID de la imagen
   * @returns Confirmación de eliminación
   */
  @Delete(':productId/images/:imageId')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar una imagen específica del producto' })
  @ApiOkResponse({ description: 'Imagen eliminada' })
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string
  ): Promise<HttpResponse<string>> {
    return this.productsService.deleteProductImage(productId, imageId);
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
   * @param UpdateProductDto Datos del producto a actualizar
   * @param user Usuario que actualiza el producto
   * @returns Información del producto actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
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
