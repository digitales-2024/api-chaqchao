import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { GetCategoryDto } from './dto/get-category.dto';
import { ProductsService } from 'src/modules/admin/products/products.service';
import { ProductData } from 'src/interfaces';
import { GetProductDto } from './dto/get-products.dto';
import { ReportsService } from 'src/modules/admin/reports/report.service';

@ApiTags('Shop Catalog')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'catalog',
  version: '1'
})
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly productsService: ProductsService,
    private readonly reportsService: ReportsService
  ) {}

  /**
   * Maneja la solicitud HTTP GET para recuperar todas las categorías activas.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de categorías.
   * @returns Una respuesta JSON que contiene una lista de todas las categorías activas.
   * @throws Error: si no se encuentran categorías activas.
   */
  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías activas' })
  @ApiOkResponse({ description: 'Todas las categorías activas' })
  @ApiBadRequestResponse({ description: 'No se encontraron categorías activas' })
  async getCategories(@Res() res: Response) {
    const categories = await this.catalogService.getAllCategories();
    res.json(categories);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar categorías activas
   * filtradas por nombre.
   * @param filter - Filtro opcional para buscar por nombre de categoría.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de categorías.
   * @returns Una respuesta JSON que contiene una lista de categorías activas
   * filtradas por el nombre proporcionado.
   * @throws Error: si no se encuentran categorías activas.
   */
  @Get('category')
  @ApiOperation({ summary: 'Obtener categorías activas filtradas por nombre' })
  @ApiOkResponse({ description: 'Categorías activas filtradas por nombre' })
  @ApiBadRequestResponse({ description: 'No se encontraron categorías activas' })
  @ApiQuery({ type: GetCategoryDto, description: 'Filtro de categorías' })
  async getCategory(@Query() filter: GetCategoryDto, @Res() res: Response) {
    const categories = await this.catalogService.getFilteredCategory(filter);
    res.json(categories);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar productos activos y
   * disponibles filtrados por diferentes criterios.
   * @param filter - Filtro opcional para buscar por nombre, precio
   *                 máximo, precio mínimo y nombre de categoría.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la
   *              lista de productos.
   * @returns Una respuesta JSON que contiene una lista de productos
   *          activos y disponibles filtrados por el filtro
   *          proporcionado.
   * @throws Error: si no se encuentran productos activos y disponibles.
   */
  @Get('products')
  @ApiOperation({ summary: 'Obtener productos activos y disponibles' })
  @ApiOkResponse({ description: 'Productos activos y disponibles' })
  @ApiBadRequestResponse({ description: 'No se encontraron productos activos y disponibles' })
  @ApiQuery({ type: GetProductDto, description: 'Filtro de productos' })
  async getProducts(@Query() filter: GetProductDto, @Res() res: Response) {
    const products = await this.catalogService.getFilteredProducts(filter);
    res.json(products);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar todos los productos de la
   * categoría Merch.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de
   *              productos.
   * @returns Una respuesta JSON que contiene una lista de todos los productos
   *          de la categoría Merch.
   * @throws Error: si no se encuentran productos en la categoría Merch.
   */
  @Get('merch')
  @ApiOperation({ summary: 'Obtener todos los productos de la categoría Merch' })
  @ApiOkResponse({ description: 'Todos los productos de la categoría Merch' })
  @ApiBadRequestResponse({ description: 'No se encontraron productos en la categoría Merch' })
  async getMerch(@Res() res: Response) {
    const merch = await this.catalogService.getMerch();
    res.json(merch);
  }

  /**
   * Maneja HTTP Obtenga solicitudes para recuperar productos recomendados para un cliente específico.
   * @param id - La identificación del cliente solía buscar productos recomendados.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de productos recomendados.
   * @returns Una respuesta JSON que contiene una lista de productos recomendados para el cliente especificado.
   * @throws Error: si no se encuentran productos recomendados para el cliente.
   */
  @Get('/recommend/:id')
  @ApiOperation({ summary: 'Obtener productos recomendados para un cliente' })
  @ApiOkResponse({ description: 'Productos recomendados para un cliente' })
  @ApiBadRequestResponse({
    description: 'No se encontraron productos recomendados para el cliente'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID del cliente' })
  async getRecommendedProducts(@Param() id: string, @Res() res: Response) {
    const products = await this.catalogService.getRecommendedProductsByClient(id);
    res.json(products);
  }

  /**
   * Maneja HTTP Obtenga solicitudes para recuperar productos recomendados por categoría.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de productos recomendados.
   * @returns Una respuesta JSON que contiene una lista de productos recomendados por categoría.
   * @throws Error: si no se encuentran productos recomendados.
   */
  @Get('/recommend')
  @ApiOperation({ summary: 'Obtener productos recomendados por categoría' })
  @ApiOkResponse({ description: 'Productos recomendados por categoría' })
  @ApiBadRequestResponse({ description: 'No se encontraron productos recomendados por categoría' })
  async getRecommendedProductsByCategory(@Res() res: Response) {
    const products = await this.catalogService.getRecommendedProducts();
    res.json(products);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar un producto por su identificación.
   *
   * @param id - La identificación del producto para recuperar.
   * @returns Una promesa que se resuelve a los datos del producto.
   * @throws Error si no se puede encontrar el producto.
   */
  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener un producto por su ID' })
  @ApiOkResponse({ description: 'Datos del producto' })
  @ApiBadRequestResponse({ description: 'No se encontró el producto' })
  @ApiParam({ name: 'id', type: String, description: 'ID del producto' })
  async getProductsbyId(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar categorías con productos
   * activos y disponibles filtradas por diferentes criterios.
   * @param filter - Filtro opcional para buscar por nombre de categoría.
   * @param res - El objeto de respuesta HTTP utilizado para enviar la lista de
   *              categorías con productos activos y disponibles.
   * @returns Una respuesta JSON que contiene una lista de categorías con productos
   *          activos y disponibles filtrados por el filtro proporcionado.
   * @throws Error: si no se encuentran categorías con productos activos y disponibles.
   */
  @Get('products-category')
  @ApiOperation({ summary: 'Obtener categorías con productos activos y disponibles' })
  @ApiOkResponse({ description: 'Categorías con productos activos y disponibles' })
  @ApiBadRequestResponse({
    description: 'No se encontraron categorías con productos activos y disponibles'
  })
  @ApiQuery({ type: GetCategoryDto, description: 'Filtro de categorías' })
  async getProductCategory(@Query() filter: GetCategoryDto, @Res() res: Response) {
    const productCategories = await this.catalogService.getFilteredProductCategory(filter);
    res.json(productCategories);
  }

  /**
   * Maneja la solicitud HTTP GET para recuperar productos de una categoría
   * específica por su identificación.
   *
   * @param id - La identificación de la categoría para recuperar sus productos.
   * @returns Una promesa que se resuelve a los datos de los productos de la
   *          categoría con la identificación proporcionada.
   * @throws Error si no se puede encontrar la categoría o no tiene productos
   *          activos y disponibles.
   */
  @Get('products-category/:id')
  @ApiOperation({ summary: 'Obtener productos de una categoría por su ID' })
  @ApiOkResponse({ description: 'Productos de la categoría' })
  @ApiBadRequestResponse({
    description: 'No se encontró la categoría o no tiene productos activos y disponibles'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID de la categoría' })
  async getProductCategoryById(@Param('id') id: string, @Res() res: Response) {
    const productCategories = await this.catalogService.getProductCategoryById(id);
    res.json(productCategories);
  }
}
