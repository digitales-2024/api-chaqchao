import { Controller, Get, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Response } from 'express';
import { Auth, Module, Permission } from '../auth/decorators';
import { GetTopProductsDto } from './dto/get-top-products.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ReportsService } from './report.service';

@ApiTags('Admin Reports')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'reports',
  version: '1'
})
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Obtiene los pedidos filtrados por diferentes criterios.
   *
   * @param filter Filtro de pedidos, que puede contener:
   *   - `isActive`: Filtrado por estado activo (true) o inactivo (false).
   *   - `date`: Fecha exacta para filtrar los pedidos, en formato `YYYY-MM-DD`.
   *   - `startDate` y `endDate`: Fecha de inicio y fin para filtrar los pedidos por un rango de fechas, en formato `YYYY-MM-DD`.
   *   - `priceMin` y `priceMax`: Rango de precios para filtrar los pedidos.
   * @returns Los pedidos filtrados.
   */
  @Get('orders')
  @ApiOperation({ summary: 'Obtener reporte de pedidos' })
  @ApiBadRequestResponse({ description: 'Error al obtener los pedidos' })
  async getOrdersReport(@Query() filter: OrderFilterDto, @Res() res: Response) {
    const orders = await this.reportsService.getFilteredOrders(filter);
    res.json(orders);
  }

  /**
   * Obtener reporte de productos
   *
   * @param {ProductFilterDto} filter - Filtro para obtener los productos
   * @param {Response} res - Respuesta HTTP
   * @returns {Promise<void>}
   */
  @Get('products')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener reporte de productos' })
  @ApiBadRequestResponse({ description: 'Error al obtener los productos' })
  async getProductsReport(@Query() filter: ProductFilterDto, @Res() res: Response): Promise<void> {
    const products = await this.reportsService.getFilteredProducts(filter);
    res.json(products);
  }

  /**
   * Exportar un reporte de pedidos en formato PDF
   * @param {Response} res - Respuesta HTTP
   * @param {OrderFilterDto} filter - Filtro para obtener los pedidos
   * @returns {Promise<void>}
   */
  @Get('export/order/pdf')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de pedidos en PDF' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de pedidos' })
  async exportPdf(@Res() res: Response, @Query() filter: OrderFilterDto): Promise<void> {
    // Obtener los datos de órdenes filtrados
    const orders = await this.reportsService.getFilteredOrders(filter);
    const pdfBuffer = await this.reportsService.generatePDFOrder(orders, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_report.pdf"');
    res.send(pdfBuffer);
  }

  /**
   * Exportar un reporte de pedidos en formato Excel.
   *
   * @param {Response} res - Objeto de respuesta HTTP para enviar el archivo Excel.
   * @param {OrderFilterDto} filter - Filtro para obtener los pedidos según criterios especificados.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo Excel se envía como respuesta.
   */
  @Get('export/order/excel')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de pedidos en Excel' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de pedidos' })
  async exportExcel(@Res() res: Response, @Query() filter: OrderFilterDto): Promise<void> {
    const data = await this.reportsService.getFilteredOrders(filter);
    const excelBuffer = await this.reportsService.generateExcelOrder(data, filter);
    // Configura los encabezados para la descarga del archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');
    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }

  /**
   * Exportar un reporte de productos en formato PDF.
   *
   * @param {Response} res - Objeto de respuesta HTTP para enviar el archivo PDF.
   * @param {ProductFilterDto} filter - Filtro para obtener los productos según los criterios especificados.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo PDF se envía como respuesta.
   */
  @Get('export/product/pdf')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de productos en PDF' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de productos' })
  async exportPdfProduct(@Res() res: Response, @Query() filter: ProductFilterDto): Promise<void> {
    // Obtener los datos de productos filtrados
    const products = await this.reportsService.getFilteredProducts(filter);
    const pdfBuffer = await this.reportsService.generatePDFProduct(products, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="products_report.pdf"');
    res.send(pdfBuffer);
  }

  /**
   * Exportar un reporte de productos en formato Excel.
   *
   * @param {Response} res - Objeto de respuesta HTTP para enviar el archivo Excel.
   * @param {ProductFilterDto} filter - Filtro para obtener los productos según los criterios especificados.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo Excel se envía como respuesta.
   */
  @Get('export/product/excel')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de productos en Excel' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de productos' })
  async exportExcelProduct(@Res() res: Response, @Query() filter: ProductFilterDto): Promise<void> {
    const data = await this.reportsService.getFilteredProducts(filter);
    const excelBuffer = await this.reportsService.generateExcelProduct(data, filter);
    // Configura los encabezados para la descarga del archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=products_report_${new Date().getFullYear()}.xlsx`
    );
    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }

  /**
   * Obtener los productos más vendidos dentro de un rango de fechas especificado.
   *
   * @param {GetTopProductsDto} getTopProductDto - DTO que contiene los parámetros para filtrar los productos más vendidos.
   * @param {Response} res - Objeto de respuesta HTTP para enviar los productos más vendidos.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando los productos más vendidos se envían en la respuesta.
   */
  @Get('top-products')
  @ApiOperation({ summary: 'Obtener productos más vendidos' })
  @ApiBadRequestResponse({ description: 'Error al obtener los productos más vendidos' })
  async getTopProducts(
    @Query() getTopProductDto: GetTopProductsDto,
    @Res() res: Response
  ): Promise<void> {
    const topProducts = await this.reportsService.getTopProducts(getTopProductDto);
    res.json(topProducts);
  }

  /**
   * Exportar un reporte de los productos más vendidos en formato PDF.
   *
   * @param {Response} res - Objeto de respuesta HTTP para enviar el archivo PDF.
   * @param {GetTopProductsDto} filter - Filtro para obtener los productos más vendidos según los criterios especificados.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo PDF se envía como respuesta.
   */
  @Get('export/top-product/pdf')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de productos más vendidos en PDF' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de productos más vendidos' })
  async exportPdfTopProduct(
    @Res() res: Response,
    @Query() filter: GetTopProductsDto
  ): Promise<void> {
    // Obtener los datos de productos top filtrados
    const topProducts = await this.reportsService.getTopProducts(filter);
    const pdfBuffer = await this.reportsService.generatePDFTopProduct(topProducts, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="products_top_report.pdf"');
    res.send(pdfBuffer);
  }

  /**
   * Exportar un reporte de los productos más vendidos en formato Excel.
   *
   * @param {Response} res - Objeto de respuesta HTTP para enviar el archivo Excel.
   * @param {GetTopProductsDto} filter - Filtro para obtener los productos más vendidos según los criterios especificados.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo Excel se envía como respuesta.
   */
  @Get('export/top-product/excel')
  @Module('RPT')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Exportar reporte de productos más vendidos en Excel' })
  @ApiBadRequestResponse({ description: 'Error al exportar el reporte de productos más vendidos' })
  async exportExcelTopProduct(
    @Res() res: Response,
    @Query() filter: GetTopProductsDto
  ): Promise<void> {
    const data = await this.reportsService.getTopProducts(filter);
    const excelBuffer = await this.reportsService.generateExcelTopProduct(data, filter);
    // Configura los encabezados para la descarga del archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=top_products_report.xlsx');

    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }
}
