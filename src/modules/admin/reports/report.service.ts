import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderFilterDto } from './dto/order-filter.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path'; // Asegúrate de importar el módulo 'path'
import { Buffer } from 'buffer'; // Importa el módulo Buffer
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private prisma: PrismaService) {}

  // Método para generar Excel
  async generateExcel(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders Report');
    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 37 },
      { header: 'Codigo Unico', key: 'pickupCode', width: 13 },
      { header: 'Hora de Recojo', key: 'pickupTime', width: 20 },
      { header: 'Total', key: 'totalAmount', width: 7 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Direccion de Recojo', key: 'address', width: 50 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Actualizado', key: 'updatedAt', width: 20 }
    ];
    data.forEach((order) => {
      worksheet.addRow({
        id: order.id,
        pickupCode: order.pickupCode,
        pickupTime: order.pickupTime,
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        address: order.pickupAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generacion de PDF con Puppeteer
   */
  async generatePDFWithPuppeteer(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'ordersReport.html');
    console.log('Ruta de la plantilla HTML:', templatePath); // Para verificar la ruta

    // Leer el contenido de la plantilla HTML
    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    // Rellenar la plantilla con los datos de los pedidos
    const htmlContent = templateHtml.replace('{{orders}}', this.generateOrderHtml(data));

    // Generar el PDF usando Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBufferUint8Array = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
  }

  // Generar el contenido HTML para los pedidos
  private generateOrderHtml(data: any): string {
    let ordersHtml = '';
    data.forEach((order) => {
      ordersHtml += `<tr>
        <td>${order.id}</td>
        <td>${order.pickupCode}</td>
        <td>${order.pickupTime.toLocaleString()}</td>
        <td>${order.orderStatus}</td>
        <td>${order.totalAmount}</td>
        <td>${order.pickupAddress}</td>
      </tr>`;
    });
    return ordersHtml;
  }

  /**
   * Filtrado de datos para Orders
   * @param orderStatus filtrado por Status
   * @param date filtado por fecha exacta
   * @param startDate filtrado por fecha de inicio
   * @param endDate filtrado por fecha de fin
   * @param isActive filtrado por activo e inactivo
   */
  async getFilteredOrders(filter: OrderFilterDto): Promise<any> {
    const orders = await this.prisma.order.findMany({
      where: {
        AND: [
          { orderStatus: filter.orderStatus || undefined },
          { createdAt: filter.date || undefined },
          { createdAt: { gte: filter.startDate, lte: filter.endDate } },
          { isActive: filter.isActive || undefined }
        ]
      },
      include: {
        cart: true,
        billingDocuments: true
      }
    });

    return orders;
  }
}
