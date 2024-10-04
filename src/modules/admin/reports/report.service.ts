import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderFilterDto } from './dto/order-filter.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';
import * as ExcelJS from 'exceljs';
import { ProductFilterDto } from './dto/product-filter.dto';
import { GetTopProductsDto } from './dto/get-top-products.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private prisma: PrismaService) {}

  // Método para generar Excel para Orders
  async generateExcelOrder(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders Report');
    worksheet.columns = [
      { header: 'Codigo Unico', key: 'pickupCode', width: 13 },
      { header: 'Hora de Recojo', key: 'pickupTime', width: 20 },
      { header: 'Total', key: 'totalAmount', width: 7 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Direccion de Recojo', key: 'address', width: 50 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Actualizado', key: 'updatedAt', width: 20 }
    ];

    // Aplicar estilo en negrita a los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    data.forEach((order) => {
      worksheet.addRow({
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
   * Generacion de PDF con Puppeteer para Orders
   */
  async generatePDFOrder(data: any): Promise<Buffer> {
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
    const whereConditions: any[] = [];

    // Filtro por booleanos (isActive)
    if (filter.isActive !== undefined) {
      whereConditions.push({
        isActive: filter.isActive
      });
    }
    // Filtro por fechas
    if (filter.date) {
      const selectedDate = new Date(filter.date);

      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereConditions.push({
        pickupTime: {
          gte: startOfDay.toISOString(), // Mayor o igual al inicio del día
          lte: endOfDay.toISOString() // Menor o igual al final del día
        }
      });
    }

    if (filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate).toISOString();
      const end = new Date(filter.endDate).toISOString();
      const startOfDay = new Date(start);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(end);
      endOfDay.setUTCHours(23, 59, 59, 999);
      whereConditions.push({
        pickupTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      });
    }

    // Filtro por estado
    if (filter.orderStatus !== undefined) {
      whereConditions.push({
        orderStatus: filter.orderStatus
      });
    }

    // Ejecutar la consulta
    const orders = await this.prisma.order.findMany({
      where: {
        AND: whereConditions
      },
      include: {
        cart: true
      }
    });

    return orders;
  }

  // Método para generar Excel para Products
  async generateExcelProduct(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products Report');
    worksheet.columns = [
      { header: 'Codigo Unico', key: 'pickupCode', width: 13 },
      { header: 'Hora de Recojo', key: 'pickupTime', width: 20 },
      { header: 'Total', key: 'totalAmount', width: 7 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Direccion de Recojo', key: 'address', width: 50 },
      { header: 'Creado', key: 'createdAt', width: 20 },
      { header: 'Actualizado', key: 'updatedAt', width: 20 }
    ];
    // Aplicar estilo en negrita a los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    data.forEach((product) => {
      worksheet.addRow({
        pickupCode: product.pickupCode,
        pickupTime: product.pickupTime,
        totalAmount: product.totalAmount,
        status: product.productStatus,
        address: product.pickupAddress,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generacion de PDF con Puppeteer para Products
   */
  async generatePDFProduct(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'productsReport.html');
    console.log('Ruta de la plantilla HTML:', templatePath); // Para verificar la ruta

    // Leer el contenido de la plantilla HTML
    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    // Rellenar la plantilla con los datos de los productos
    const htmlContent = templateHtml.replace('{{products}}', this.generateProductHtml(data));

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

  // Generar el contenido HTML para los productos
  private generateProductHtml(data: any): string {
    let productsHtml = '';
    data.forEach((product) => {
      productsHtml += `<tr>
        <td>${product.name}</td>
        <td>${product.createdAt.toLocaleString()}</td>
        <td>${product.description}</td>
        <td>${product.price}</td>
        <td>${product.image}</td>
        <td>${product.category.name}</td>
      </tr>`;
    });
    return productsHtml;
  }

  /**
   * Filtrado de datos para Products
   * @param name filtrado por name
   * @param date filtado por fecha exacta
   * @param startDate filtrado por fecha de inicio
   * @param endDate filtrado por fecha de fin
   * @param isActive filtrado por activo e inactivo
   * @param isAvailable filtrado por disponibilidad
   * @param isRestricted filtrado por restriccion
   */
  async getFilteredProducts(filter: ProductFilterDto): Promise<any> {
    const whereConditions: any[] = [];

    // Filtro por booleanos (isActive, isAvailable, isRestricted)
    if (filter.isActive !== undefined) {
      whereConditions.push({
        isActive: filter.isActive
      });
    }

    if (filter.isRestricted !== undefined) {
      whereConditions.push({
        isRestricted: filter.isRestricted
      });
    }

    if (filter.isAvailable !== undefined) {
      whereConditions.push({
        isAvailable: filter.isAvailable
      });
    }

    if (filter.name) {
      whereConditions.push({
        name: {
          contains: filter.name,
          mode: 'insensitive'
        }
      });
    }

    if (filter.date) {
      const selectedDate = new Date(filter.date);

      const startOfDay = new Date(selectedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereConditions.push({
        pickupTime: {
          gte: startOfDay.toISOString(), // Mayor o igual al inicio del día
          lte: endOfDay.toISOString() // Menor o igual al final del día
        }
      });
    }

    if (filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate).toISOString();
      const end = new Date(filter.endDate).toISOString();
      whereConditions.push({
        createdAt: {
          gte: start,
          lte: end
        }
      });
    }

    if (filter.priceMin && filter.priceMax) {
      whereConditions.push({
        price: {
          gte: filter.priceMin,
          lte: filter.priceMax
        }
      });
    }

    if (filter.categoryName) {
      whereConditions.push({
        category: {
          name: {
            contains: filter.categoryName
          }
        }
      });
    }

    const products = await this.prisma.product.findMany({
      where: {
        AND: whereConditions
      },
      include: {
        category: true,
        productVariations: true
      }
    });

    return products;
  }

  // Método para generar Excel para Top Products
  async generateExcelTopProduct(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Top Products Report');
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Cantidad', key: 'quantity', width: 10 }
    ];

    // Aplicar estilo en negrita a los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    data.forEach((topProducts) => {
      worksheet.addRow({
        name: topProducts.name,
        quantity: topProducts.totalOrdered
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generacion de PDF para los Productos mas vendidos dentro de un rango de fechas
   */
  async generatePDFTopProduct(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(
      __dirname,
      '../../../../',
      'templates',
      'productsTopReport.html'
    );
    console.log('Ruta de la plantilla HTML:', templatePath); // Para verificar la ruta

    // Leer el contenido de la plantilla HTML
    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    // Rellenar la plantilla con los datos de los productos mas vendidos
    const htmlContent = templateHtml.replace('{{products}}', this.generateTopProductHtml(data));

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

  // Generar el contenido HTML para los productos mas vendidos
  private generateTopProductHtml(data: any): string {
    let productTopHtml = '';
    data.forEach((productTop) => {
      productTopHtml += `<tr>
        <td>${productTop.name}</td>
        <td>${productTop.totalOrdered}</td>
      </tr>`;
    });
    return productTopHtml;
  }

  /**
   * Reporte de los productos ams vendidos durante una fecha especifica
   */
  async getTopProducts(dto: GetTopProductsDto): Promise<any> {
    const { startDate, endDate } = dto;

    // Validar que las fechas existan y sean válidas
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son obligatorias.');
    }
    // Convertir las fechas a formato ISO para evitar errores de formato
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    console.log(start, end);

    // Consultar los productos más solicitados en el período de tiempo
    try {
      const topProducts = await this.prisma.cartItem.groupBy({
        by: ['productId'], // Agrupar por ID de producto
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          quantity: true // Sumar las cantidades de cada producto
        },
        orderBy: {
          _sum: {
            quantity: 'desc' // Ordenar por la cantidad solicitada
          }
        },
        take: 10 // Opcional: limitar a los 10 productos más solicitados
      });

      // Incluir los detalles del producto
      const productsWithDetails = await Promise.all(
        topProducts.map(async (product) => {
          const details = await this.prisma.product.findUnique({
            where: { id: product.productId }
          });
          return {
            id: details.id,
            name: details.name,
            totalOrdered: product._sum.quantity
          };
        })
      );

      return productsWithDetails;
    } catch (error) {
      console.log('Error getting top products', error);
      throw new Error('Error getting top products');
    }
  }
}
