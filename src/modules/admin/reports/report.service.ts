import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
   * Genera un archivo PDF que contiene un reporte de los pedidos dentro de un rango de fechas especificado.
   * @param {any} data - Datos que representan los pedidos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFOrder(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'ordersReport.html');

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
   * Filtrado de órdenes basado en varios criterios.
   *
   * @param {string} [orderStatus] - Filtrado por el estado de la orden (p.ej., 'PENDING', 'COMPLETED').
   * @param {string} [date] - Fecha exacta para filtrar órdenes, en formato `YYYY-MM-DD`.
   * @param {string} [startDate] - Fecha de inicio para filtrar órdenes por un rango de fechas, en formato `YYYY-MM-DD`.
   * @param {string} [endDate] - Fecha de fin para filtrar órdenes por un rango de fechas, en formato `YYYY-MM-DD`.
   * @param {boolean} [isActive] - Filtrado por estado activo (true) o inactivo (false).
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
          gte: startOfDay.toISOString(),
          lte: endOfDay.toISOString()
        }
      });
    }

    if (filter.priceMin && filter.priceMax) {
      whereConditions.push({
        totalAmount: {
          gte: filter.priceMin,
          lte: filter.priceMax
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return orders;
  }

  // Método para generar Excel para Products
  async generateExcelProduct(data: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products Report');
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 13 },
      { header: 'Descripción', key: 'description', width: 20 },
      { header: 'Precio', key: 'price', width: 7 },
      { header: 'Imagen', key: 'image', width: 50 },
      { header: 'Disponible', key: 'isAvailable', width: 15 },
      { header: 'Estado', key: 'isActive', width: 15 },
      { header: 'Restringido', key: 'isRestricted', width: 15 },
      { header: 'Creado', key: 'createdAt', width: 15 },
      { header: 'Actualizado', key: 'updatedAt', width: 15 }
    ];
    // Aplicar estilo en negrita a los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    data.forEach((product) => {
      worksheet.addRow({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isAvailable: product.isAvailable,
        isActive: product.isActive,
        isRestricted: product.isRestricted,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Genera un archivo PDF que contiene un reporte de los productos dentro de un rango de fechas especificado.
   * @param {any} data - Datos que representan los productos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFProduct(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'productsReport.html');

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
   * Filtrado de productos basado en diferentes criterios.
   *
   * @param {string} [name] - Nombre del producto para filtrado por coincidencia parcial (insensible a mayúsculas).
   * @param {string} [date] - Fecha exacta para filtrar los productos, en formato `YYYY-MM-DD`.
   * @param {string} [startDate] - Fecha de inicio para filtrar productos por un rango de fechas, en formato `YYYY-MM-DD`.
   * @param {string} [endDate] - Fecha de fin para filtrar productos por un rango de fechas, en formato `YYYY-MM-DD`.
   * @param {boolean} [isActive] - Filtrado por estado activo (true) o inactivo (false).
   * @param {boolean} [isAvailable] - Filtrado por disponibilidad del producto.
   * @param {boolean} [isRestricted] - Filtrado por productos con restricción.
   */
  async getFilteredProducts(filter: ProductFilterDto): Promise<any> {
    const whereConditions: any[] = [];

    // Filtro por una fecha específica
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

    // Filtro por rango de fechas (startDate - endDate)
    if (filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate).toISOString();
      const end = new Date(filter.endDate).toISOString();
      whereConditions.push({
        pickupTime: {
          gte: start,
          lte: end
        }
      });
    }

    // Filtro por nombre de la categoría del producto
    if (filter.categoryName) {
      whereConditions.push({
        cart: {
          cartItems: {
            some: {
              product: {
                category: {
                  name: {
                    contains: filter.categoryName, // Filtra por el nombre de la categoría
                    mode: 'insensitive' // Case-insensitive
                  }
                }
              }
            }
          }
        }
      });
    }

    // Filtro por rango de precios (priceMin - priceMax)
    if (filter.priceMin !== undefined && filter.priceMax !== undefined) {
      whereConditions.push({
        cart: {
          cartItems: {
            some: {
              product: {
                price: {
                  gte: filter.priceMin,
                  lte: filter.priceMax
                }
              }
            }
          }
        }
      });
    }

    const orders = await this.prisma.order.findMany({
      where: {
        AND: whereConditions // Aplica todos los filtros juntos
      },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: {
                  include: {
                    category: true // Incluir detalles de la categoría
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Ordenar por la fecha de creación
      }
    });

    // Extraer los detalles del producto de los cartItems y eliminar duplicados
    const productMap = new Map();
    orders.forEach((order) => {
      order.cart.cartItems.forEach((item) => {
        const product = item.product;
        // Filtrar por categoría si se especifica
        if (
          (!filter.categoryName ||
            (product.category && product.category.name === filter.categoryName)) &&
          (!filter.priceMin || product.price >= filter.priceMin) &&
          (!filter.priceMax || product.price <= filter.priceMax)
        ) {
          if (!productMap.has(product.id)) {
            productMap.set(product.id, {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image: product.image,
              isAvailable: product.isAvailable,
              isRestricted: product.isRestricted,
              isActive: product.isActive,
              category: {
                id: product.category.id,
                name: product.category.name,
                description: product.category.description
              }
            });
          }
        }
      });
    });

    return Array.from(productMap.values()); // Devolver los productos filtrados sin duplicados
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
   * Genera un archivo PDF que contiene un reporte de los productos más vendidos dentro de un rango de fechas especificado.
   * @param {any} data - Datos que representan los productos más vendidos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFTopProduct(data: any): Promise<Buffer> {
    // Definir la ruta a la plantilla HTML
    const templatePath = path.join(
      __dirname,
      '../../../../',
      'templates',
      'productsTopReport.html'
    );

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
   * Obtiene los productos más vendidos dentro de un rango de fechas específico.
   *
   * @param {GetTopProductsDto} dto - Objeto DTO que contiene las fechas de inicio y fin para el filtrado.
   * @param {string} dto.startDate - Fecha de inicio del rango en formato `YYYY-MM-DD`.
   * @param {string} dto.endDate - Fecha de fin del rango en formato `YYYY-MM-DD`.
   *
   * @returns {Promise<any>} - Retorna una lista de productos con los detalles y la cantidad total vendida.
   * @throws {Error} - Lanza un error si las fechas no son válidas o no se pueden obtener los productos más vendidos.
   *
   * @example - const topProducts = await getTopProducts({ startDate: '2024-01-01', endDate: '2024-01-31' });
   */

  async getTopProducts(dto: GetTopProductsDto): Promise<any> {
    const { startDate, endDate, limit } = dto;

    // Validar que las fechas existan y sean válidas
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son obligatorias.');
    }

    // Asignar un valor por defecto si el límite no está presente
    let numericLimit;
    if (limit) {
      numericLimit = Number(limit);

      // Validar que el límite sea uno de los permitidos
      const allowedLimits = [10, 15, 20];
      if (!allowedLimits.includes(numericLimit)) {
        throw new Error('The limit must be one of the following values: 10, 15, 20.');
      }
    }

    // Convertir las fechas a formato ISO para evitar errores de formato
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    // Consultar los productos más solicitados en el período de tiempo
    try {
      const topProducts = await this.prisma.cartItem.groupBy({
        by: ['productId'],
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
            quantity: 'desc'
          }
        },
        ...(numericLimit && { take: numericLimit }) // Limitar la cantidad de productos si hay un límite
      });

      // Incluir los detalles del producto
      const productsWithDetails = await Promise.all(
        topProducts.map(async (product) => {
          const details = await this.prisma.product.findUnique({
            where: { id: product.productId },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              isAvailable: true,
              isRestricted: true,
              isActive: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          });
          return {
            id: details.id,
            name: details.name,
            isActive: details.isActive,
            price: details.price,
            image: details.image,
            category: {
              id: details.category.id,
              name: details.category.name,
              description: details.category.description
            },
            totalOrdered: product._sum.quantity
          };
        })
      );

      return productsWithDetails;
    } catch (error) {
      console.log('Error getting top products', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error getting top products');
    }
  }
}
