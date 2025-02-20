import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CartStatus, Prisma } from '@prisma/client';
import { Buffer } from 'buffer';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTopProductsDto } from './dto/get-top-products.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { ProductFilterDto } from './dto/product-filter.dto';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ProductImages[];
  isAvailable: boolean;
  isRestricted: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    description: string;
  };
}

interface ProductImages {
  id: string;
  url: string;
  order: number;
  isMain: boolean;
}

export interface ProductTop {
  id: string;
  name: string;
  isActive: boolean;
  price: number;
  images: ProductImages[];
  category: {
    id: string;
    name: string;
    description: string;
  };
  totalOrdered: number;
}

interface Order {
  [x: string]: any;
  id: string;
  cartId: string;
  pickupCode: string;
  totalAmount: string;
  pickupTime: string;
  orderStatus: string;
  pickupAddress: string;
  someonePickup: boolean;
  comments: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cart: {
    id: string;
    clientId: string;
    cartStatus: CartStatus;
    createdAt: string;
    updatedAt: string;
  };
}
const translateStatus: Record<Order['orderStatus'], string> = {
  CONFIRMED: 'Confirmado',
  READY: 'Listo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendiente'
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private prisma: PrismaService) {}

  // Método para generar Excel para Orders
  async generateExcelOrder(data: Order[], filter: OrderFilterDto) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders Report');
    worksheet.columns = [
      { header: 'Codigo Único', key: 'pickupCode', width: 20 },
      { header: 'Fecha de Recojo', key: 'pickupTime', width: 20 },
      { header: 'Total', key: 'totalAmount', width: 7 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Modo de Recojo', key: 'mode', width: 12 }
    ];

    worksheet.addRow({
      pickupCode: 'Reporte de Pedidos'
    });

    worksheet.addRow({
      pickupCode: 'Fecha de Reporte: ',
      pickupTime: filter.startDate + ' / ' + filter.endDate
    });

    if (filter.orderStatus) {
      worksheet.addRow({
        pickupCode: 'Estado: ',
        pickupTime: translateStatus[filter.orderStatus]
      });
    }

    if (filter.priceMin !== undefined && filter.priceMax !== undefined) {
      worksheet.addRow({
        pickupCode: 'Rango de Precios: ',
        pickupTime: filter.priceMin + ' - ' + filter.priceMax
      });
    }

    // Eliminar el contenido de las celdas de la fila 1 (A1 a I1)
    for (let col = 1; col <= 9; col++) {
      worksheet.getCell(1, col).value = null; // Limpia la celda en la fila 1, columna col
    }

    worksheet.addRow({
      pickupCode: 'Codigo Único',
      pickupTime: 'Fecha de Recojo',
      totalAmount: 'Total',
      status: 'Estado',
      mode: 'Modo de Recojo'
    });

    data.forEach((order) => {
      worksheet.addRow({
        pickupCode: order.pickupCode,
        pickupTime: order.pickupTime,
        totalAmount: order.totalAmount,
        status: translateStatus[order.orderStatus],
        mode: order.someonePickup ? 'Recoge otra persona' : 'Recoge el cliente'
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Genera un archivo PDF que contiene un reporte de los pedidos dentro de un rango de fechas especificado.
   * @param {Order[]} data - Datos que representan los pedidos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFOrder(data: Order[], filter: OrderFilterDto): Promise<Buffer> {
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

    const infoBussiness = await this.prisma.businessConfig.findFirst({
      select: {
        businessName: true
      }
    });

    const htmlInfo = `<h2>${infoBussiness.businessName.toUpperCase() || ''}</h2>
<p>Fechas: ${filter.startDate || ''} / ${filter.endDate} </p>
        ${filter.orderStatus ? '<p>Estado: ' + translateStatus[filter.orderStatus] + ' </p>' : ''}
        ${filter.priceMin !== undefined && filter.priceMax !== undefined ? '<p>Rango de Precios: ' + filter.priceMin + ' - ' + filter.priceMax + ' </p>' : ''}
    `;

    // Rellenar la plantilla con los datos de los pedidos
    const htmlContent = templateHtml.replace('{{orders}}', this.generateOrderHtml(data));
    const htmlContentWithInfo = htmlContent.replace('{{bussiness}}', htmlInfo);
    const htmlDateReport = htmlContentWithInfo.replace(
      '{{dateReport}}',
      new Date().toLocaleDateString()
    );
    const htmlFooterReport = htmlDateReport.replace(
      '{{footerReport}}',
      `© ${new Date().getFullYear()} ${infoBussiness.businessName.toUpperCase()}`
    );

    // Generar el PDF usando Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setContent(htmlContentWithInfo);
    await page.setContent(htmlDateReport);
    await page.setContent(htmlFooterReport);
    const pdfBufferUint8Array = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
  }

  // Generar el contenido HTML para los pedidos
  private generateOrderHtml(data: Order[]): string {
    let ordersHtml = '';
    data.forEach((order) => {
      ordersHtml += `<tr>
        <td>${order.pickupCode}</td>
        <td>${order.pickupTime.toLocaleString()}</td>
        <td>${order.totalAmount}</td>
        <td>${translateStatus[order.orderStatus]}</td>
        <td>${order.someonePickup ? 'Recoge otra persona' : 'Recoge el cliente'}</td>
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
    const whereConditions: Prisma.OrderWhereInput[] = [];

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

    if (filter.priceMin !== undefined && filter.priceMax !== undefined) {
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
  async generateExcelProduct(data: Product[], filter: ProductFilterDto) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products Report');
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 20 },
      { header: 'Descripción', key: 'description', width: 20 },
      { header: 'Categoría', key: 'category', width: 10 },
      { header: 'Precio', key: 'price', width: 7 }
    ];

    worksheet.addRow({
      name: 'Reporte de Productos'
    });

    worksheet.addRow({
      name: 'Fecha de Reporte: ',
      description: filter.startDate + ' / ' + filter.endDate
    });
    if (filter.categoryName) {
      worksheet.addRow({
        name: 'Categoría: ',
        description: filter.categoryName
      });
    }

    // Eliminar el contenido de las celdas de la fila 1 (A1 a I1)
    for (let col = 1; col <= 9; col++) {
      worksheet.getCell(1, col).value = null; // Limpia la celda en la fila 1, columna col
    }

    worksheet.addRow({
      name: 'Nombre',
      description: 'Descripción',
      category: 'Categoría',
      price: 'Precio'
    });

    data.forEach((product) => {
      worksheet.addRow({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.name
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Genera un archivo PDF que contiene un reporte de los productos dentro de un rango de fechas especificado.
   * @param {Producto[]} data - Datos que representan los productos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFProduct(data: Product[], filter: ProductFilterDto): Promise<Buffer> {
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

    const infoBussiness = await this.prisma.businessConfig.findFirst({
      select: {
        businessName: true
      }
    });

    const htmlInfo = `<h2>${infoBussiness.businessName.toUpperCase() || ''}</h2>
        <p>Fechas: ${filter.startDate || ''} / ${filter.endDate} </p>
        ${filter.categoryName ? '<p>Categoría: ' + filter.categoryName + ' </p>' : ''}
    `;

    // Rellenar la plantilla con los datos de los productos
    const htmlContent = templateHtml.replace('{{products}}', this.generateProductHtml(data));
    const htmlContentWithInfo = htmlContent.replace('{{bussiness}}', htmlInfo);
    const htmlDateReport = htmlContentWithInfo.replace(
      '{{dateReport}}',
      new Date().toLocaleDateString()
    );
    const htmlFooterReport = htmlDateReport.replace(
      '{{footerReport}}',
      `© ${new Date().getFullYear()} ${infoBussiness.businessName.toUpperCase()}`
    );

    // Generar el PDF usando Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setContent(htmlContentWithInfo);
    await page.setContent(htmlDateReport);
    await page.setContent(htmlFooterReport);
    const pdfBufferUint8Array = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
  }

  // Generar el contenido HTML para los productos
  private generateProductHtml(data: Product[]): string {
    let productsHtml = '';
    data.forEach((product) => {
      productsHtml += `<tr>
      <td>${product.name}</td>
        <td style="width: 200px">${product.description}</td>
        <td>${product.category.name}</td>
        <td>${product.price}</td>
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
  async getFilteredProducts(filter: ProductFilterDto): Promise<Product[]> {
    const whereConditions: Prisma.OrderWhereInput[] = [];

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
                    category: true, // Incluir detalles de la categoría
                    images: true // Incluir imágenes del producto
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
    const productMap = new Map<string, Product>();
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
              images: product.images,
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
  async generateExcelTopProduct(data: ProductTop[], filter: GetTopProductsDto) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Top Products Report');
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Cantidad', key: 'quantity', width: 10 }
    ];

    worksheet.addRow({
      name: 'Productos más vendidos'
    });

    worksheet.addRow({
      name: 'Fecha de Reporte: ',
      quantity: filter.startDate + ' / ' + filter.endDate
    });

    if (filter.limit) {
      worksheet.addRow({
        name: 'Límite: ',
        quantity: filter.limit
      });
    }

    for (let col = 1; col <= 9; col++) {
      worksheet.getCell(1, col).value = null; // Limpia la celda en la fila 1, columna col
    }

    worksheet.addRow({
      name: 'Nombre',
      quantity: 'Cantidad'
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
   * @param {ProductTop[]} data - Datos que representan los productos más vendidos.
   *                     Se espera que contenga la información necesaria para rellenar la plantilla HTML.
   */
  async generatePDFTopProduct(data: ProductTop[], filter: GetTopProductsDto): Promise<Buffer> {
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

    const infoBussiness = await this.prisma.businessConfig.findFirst({
      select: {
        businessName: true
      }
    });

    const htmlInfo = `<h2>${infoBussiness.businessName.toUpperCase() || ''}</h2>
        <p>Fechas: ${filter.startDate || ''} / ${filter.endDate} </p>
        ${filter.limit ? '<p>Límite: ' + filter.limit + ' </p>' : ''}
    `;

    // Rellenar la plantilla con los datos de los productos mas vendidos
    const htmlContent = templateHtml.replace('{{products}}', this.generateTopProductHtml(data));
    const htmlContentWithInfo = htmlContent.replace('{{bussiness}}', htmlInfo);
    const htmlDateReport = htmlContentWithInfo.replace(
      '{{dateReport}}',
      new Date().toLocaleDateString()
    );
    const htmlFooterReport = htmlDateReport.replace(
      '{{footerReport}}',
      `© ${new Date().getFullYear()} ${infoBussiness.businessName.toUpperCase()}`
    );

    // Generar el PDF usando Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setContent(htmlContentWithInfo);
    await page.setContent(htmlDateReport);
    await page.setContent(htmlFooterReport);
    const pdfBufferUint8Array = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBufferUint8Array);

    return pdfBuffer;
  }

  // Generar el contenido HTML para los productos mas vendidos
  private generateTopProductHtml(data: ProductTop[]): string {
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
   * @returns {Promise<ProductTop[]>} - Retorna una lista de productos con los detalles y la cantidad total vendida.
   * @throws {Error} - Lanza un error si las fechas no son válidas o no se pueden obtener los productos más vendidos.
   *
   * @example - const topProducts = await getTopProducts({ startDate: '2024-01-01', endDate: '2024-01-31' });
   */

  async getTopProducts(dto: GetTopProductsDto): Promise<ProductTop[]> {
    const { startDate, endDate, limit } = dto;

    // Validar que las fechas existan y sean válidas
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son obligatorias.');
    }

    // Asignar un valor por defecto si el límite no está presente
    let numericLimit: number | undefined;
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
              isAvailable: true,
              isRestricted: true,
              isActive: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              },
              images: {
                select: {
                  id: true,
                  url: true,
                  order: true,
                  isMain: true
                }
              }
            }
          });
          return {
            id: details.id,
            name: details.name,
            isActive: details.isActive,
            price: details.price,
            images: details.images,
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
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error getting top products');
    }
  }
}
