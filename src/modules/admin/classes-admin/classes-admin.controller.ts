import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ClassesAdminService } from './classes-admin.service';
import { Auth } from '../auth/decorators';
import { ClassesDataAdmin } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Class Admin')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: '/class/admin', version: '1' })
export class ClassesAdminController {
  constructor(private readonly classesAdminService: ClassesAdminService) {}

  @ApiOkResponse({ description: 'Get class by date' })
  @Get()
  findByDate(@Query('date') date: string): Promise<ClassesDataAdmin[]> {
    return this.classesAdminService.findByDate(date);
  }

  @ApiOkResponse({ description: 'PDF file download' })
  @Post('export/classes/excel')
  async exportExcelClasses(@Res() res: Response, @Body() data: ClassesDataAdmin[]) {
    // Genera el archivo Excel usando el servicio
    const excelBuffer = await this.classesAdminService.generateExcelClasssesAdmin(data);

    // Configura los encabezados para la descarga del archivo Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Clases.xlsx');

    // Envía el archivo Excel como respuesta
    res.send(excelBuffer);
  }

  @ApiOkResponse({ description: 'Excel file download' })
  @Post('export/classes/pdf')
  async exportPdfClasses(@Res() res: Response, @Body() data: ClassesDataAdmin[]) {
    // Generar el PDF con Puppeteer usando los datos proporcionados
    const pdfBuffer = await this.classesAdminService.generatePDFClassReport(data);

    // Enviar el archivo PDF en la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="class_report.pdf"');
    res.send(pdfBuffer);
  }
}
