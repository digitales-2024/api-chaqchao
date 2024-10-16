import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsService } from './report.service';
import { OrderFilterDto } from './dto/order-filter.dto';
import { Response } from 'express';
import { ApiBadRequestResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { ProductFilterDto } from './dto/product-filter.dto';
import { GetTopProductsDto } from './dto/get-top-products.dto';

@ApiTags('Reports')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'reports',
  version: '1'
})
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders')
  async getOrdersReport(@Query() filter: OrderFilterDto, @Res() res: Response) {
    const orders = await this.reportsService.getFilteredOrders(filter);
    res.json(orders);
  }

  @Get('products')
  async getProductsReport(@Query() filter: ProductFilterDto, @Res() res: Response) {
    const products = await this.reportsService.getFilteredProducts(filter);
    res.json(products);
  }

  @Get('export/order/pdf')
  async exportPdf(@Res() res: Response, @Query() filter: OrderFilterDto) {
    // Obtener los datos de órdenes filtrados
    const orders = await this.reportsService.getFilteredOrders(filter);
    const pdfBuffer = await this.reportsService.generatePDFOrder(orders, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_report.pdf"');
    res.send(pdfBuffer);
  }

  @Get('export/order/excel')
  async exportExcel(@Res() res: Response, @Query() filter: OrderFilterDto) {
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

  @Get('export/product/pdf')
  async exportPdfProduct(@Res() res: Response, @Query() filter: ProductFilterDto) {
    // Obtener los datos de productos filtrados
    const products = await this.reportsService.getFilteredProducts(filter);
    const pdfBuffer = await this.reportsService.generatePDFProduct(products, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="products_report.pdf"');
    res.send(pdfBuffer);
  }

  @Get('export/product/excel')
  async exportExcelProduct(@Res() res: Response, @Query() filter: ProductFilterDto) {
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

  @Get('top-products')
  async getTopProducts(@Query() getTopProductDto: GetTopProductsDto, @Res() res: Response) {
    const topProducts = await this.reportsService.getTopProducts(getTopProductDto);
    res.json(topProducts);
  }

  @Get('export/top-product/pdf')
  async exportPdfTopProduct(@Res() res: Response, @Query() filter: GetTopProductsDto) {
    // Obtener los datos de productos top filtrados
    const topProducts = await this.reportsService.getTopProducts(filter);
    const pdfBuffer = await this.reportsService.generatePDFTopProduct(topProducts, filter);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="products_top_report.pdf"');
    res.send(pdfBuffer);
  }

  @Get('export/top-product/excel')
  async exportExcelTopProduct(@Res() res: Response, @Query() filter: GetTopProductsDto) {
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
