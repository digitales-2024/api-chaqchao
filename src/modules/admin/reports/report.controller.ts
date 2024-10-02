import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsService } from './report.service';
import { OrderFilterDto } from './dto/order-filter.dto';
import { Response } from 'express';
import { ApiBadRequestResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';

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

  @Get('export/pdf')
  async exportPdf(@Res() res: Response, @Query() filter: OrderFilterDto) {
    // Obtener los datos de órdenes filtrados
    const orders = await this.reportsService.getFilteredOrders(filter);
    // Generar el PDF con Puppeteer
    const pdfBuffer = await this.reportsService.generatePDFWithPuppeteer(orders);
    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_report.pdf"');
    res.send(pdfBuffer);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response, @Query() filter: OrderFilterDto) {
    const data = await this.reportsService.getFilteredOrders(filter);
    const excelBuffer = await this.reportsService.generateExcel(data);
    // Configura los encabezados para la descarga del archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');

    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }
}
