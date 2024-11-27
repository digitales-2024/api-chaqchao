import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AdminGateway } from '../admin.gateway';
import { OrderDetails, OrderInfo } from 'src/interfaces';
import * as fs from 'fs';

@Injectable()
export class OrdersService {
  private logger = new Logger('OrdersService');
  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminGateway: AdminGateway
  ) {}

  /**
   * Mostrar todos los pedidos
   * @param date  Fecha de recogida
   * @param status  Estado del pedido
   * @returns  Pedidos
   */
  async findAll(date: string, status?: OrderStatus): Promise<OrderInfo[]> {
    try {
      const formattedDate = new Date(date);
      if (isNaN(formattedDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      const orders = await this.prismaService.order.findMany({
        include: {
          cart: {
            select: {
              id: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  lastName: true,
                  phone: true,
                  email: true
                }
              },
              cartItems: {
                select: {
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      price: true,
                      name: true,
                      image: true,
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        where: {
          pickupTime: {
            gte: formattedDate,
            lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
          },
          orderStatus: {
            ...(status === ('ALL' as unknown as OrderStatus)
              ? {
                  not: 'PENDING'
                }
              : { equals: status })
          }
        },
        orderBy: {
          pickupCode: 'desc'
        }
      });

      return orders.map((order) => ({
        id: order.id,
        orderStatus: order.orderStatus,
        pickupAddress: order.pickupAddress,
        pickupTime: order.pickupTime,
        isActive: order.isActive,
        someonePickup: order.someonePickup,
        pickupCode: order.pickupCode,
        totalAmount: order.totalAmount,
        client: order.cart.client
          ? {
              id: order.cart.client.id,
              name: order.cart.client.name,
              lastName: order.cart.client.lastName,
              phone: order.cart.client.phone,
              email: order.cart.client.email
            }
          : {
              id: null,
              name: order.customerName,
              lastName: order.customerLastName,
              phone: order.customerPhone,
              email: order.customerEmail
            }
      }));
    } catch (error) {
      this.logger.error('Error get orders', error.message);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get orders');
    }
  }

  /**
   * Mostrar un pedido
   * @param id  ID del pedido
   * @returns  Pedido
   */
  async findOne(id: string): Promise<OrderDetails> {
    try {
      const order = await this.prismaService.order.findUnique({
        include: {
          cart: {
            select: {
              id: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  lastName: true,
                  phone: true,
                  email: true
                }
              },
              cartItems: {
                select: {
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      price: true,
                      name: true,
                      image: true,
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          billingDocument: {
            select: {
              billingDocumentType: true,
              documentNumber: true,
              address: true,
              state: true,
              country: true,
              city: true,
              postalCode: true,
              typeDocument: true,
              businessName: true,
              paymentStatus: true
            }
          }
        },
        where: {
          id
        }
      });

      return {
        id: order.id,
        orderStatus: order.orderStatus,
        pickupAddress: order.pickupAddress,
        pickupTime: order.pickupTime,
        isActive: order.isActive,
        someonePickup: order.someonePickup,
        pickupCode: order.pickupCode,
        totalAmount: order.totalAmount,
        cart: {
          quantity: order.cart.cartItems.reduce((acc, { quantity }) => acc + quantity, 0),
          products: order.cart.cartItems.flatMap(({ product }) => ({
            ...product,
            quantity: order.cart.cartItems.find((item) => item.product.id === product.id).quantity
          }))
        },
        billingDocument: {
          billingDocumentType: order.billingDocument.billingDocumentType,
          documentNumber: order.billingDocument.documentNumber,
          address: order.billingDocument.address,
          state: order.billingDocument.state,
          country: order.billingDocument.country,
          city: order.billingDocument.city,
          postalCode: order.billingDocument.postalCode,
          typeDocument: order.billingDocument.typeDocument,
          businessName: order.billingDocument.businessName,
          paymentStatus: order.billingDocument.paymentStatus
        },
        client: order.cart.client
          ? {
              id: order.cart.client.id,
              name: order.cart.client.name,
              lastName: order.cart.client.lastName,
              phone: order.cart.client.phone,
              email: order.cart.client.email
            }
          : {
              id: null,
              name: order.customerName,
              phone: order.customerPhone,
              lastName: order.customerLastName,
              email: order.customerEmail
            }
      };
    } catch (error) {
      this.logger.error('Error get order', error.message);
      handleException(error, 'Error get order');
    }
  }

  /**
   * Actualizar el estado de un pedido
   * @param id  ID del pedido
   * @param status  Estado del pedido
   * @returns  Pedido actualizado
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const order = await this.prismaService.order.update({
        data: {
          orderStatus: status
        },
        where: {
          id
        }
      });

      this.adminGateway.sendOrderStatusUpdated(order.id, order.orderStatus);

      return order;
    } catch (error) {
      this.logger.error('Error update order status', error.message);
      handleException(error, 'Error update order status');
    }
  }

  /**
   * Mostrar pedidos por cliente
   * @param id  ID del cliente
   * @returns  Pedidos
   * @throws  Error
   */
  async findByClient(id: string): Promise<OrderInfo[]> {
    try {
      const ordersByClient = await this.prismaService.order.findMany({
        where: {
          cart: {
            clientId: id
          }
        },
        select: {
          id: true,
          orderStatus: true,
          pickupAddress: true,
          pickupTime: true,
          comments: true,
          isActive: true,
          someonePickup: true,
          pickupCode: true,
          totalAmount: true,
          cart: {
            select: {
              id: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  lastName: true,
                  phone: true,
                  email: true
                }
              },
              cartItems: {
                select: {
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      image: true,
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      return ordersByClient.map((order) => {
        return {
          id: order.id,
          orderStatus: order.orderStatus,
          pickupAddress: order.pickupAddress,
          pickupTime: order.pickupTime,
          isActive: order.isActive,
          someonePickup: order.someonePickup,
          pickupCode: order.pickupCode,
          totalAmount: order.totalAmount,
          client: {
            id: order.cart.client.id,
            name: order.cart.client.name,
            lastName: order.cart.client.lastName,
            phone: order.cart.client.phone,
            email: order.cart.client.email
          }
        };
      });
    } catch (error) {
      this.logger.error('Error get orders by client', error.message);
      handleException(error, 'Error get orders by client');
    }
  }

  /**
   * Exportar un pedido en formato PDF
   * @param id  ID del pedido
   * @returns  Archivo PDF
   * @throws  Error
   */
  async exportPdf(id: string): Promise<{ code: string; pdfBuffer: Buffer }> {
    const order = await this.findOne(id);

    const templatePath = path.join(__dirname, '../../../../', 'templates', 'orderEnvoice.html');

    // Leer el contenido de la plantilla HTML
    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    const orderHtml = this.generateOrderHtml(order);

    const htmlContent = templateHtml.replace('{{order}}', orderHtml);

    // Generar el archivo PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Convertir Uint8Array a Buffer
    return { code: order.pickupCode, pdfBuffer: Buffer.from(pdfBuffer) };
  }

  /**
   * Generar el contenido HTML del pedido
   * @param order  Pedido
   * @returns  Contenido HTML
   */
  private generateOrderHtml(orderData: OrderDetails): string {
    const translateStatus: Record<Order['orderStatus'], string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'Procesando',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado'
    };
    let invoiceHtml = '';

    // Encabezado de la factura
    invoiceHtml += `<div style="max-width: 800px; margin: auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px; background-color: #fff;">
    <h2 style="text-align: center;">Pedido# ${orderData.pickupCode}</h2>
    <p style="text-align: center;">Fecha: ${new Date(orderData.pickupTime).toLocaleDateString()} a las ${new Date(orderData.pickupTime).toLocaleTimeString()}</p>
    <p style="text-align: center;">Estado: <span style="color: #3498db;">${translateStatus[orderData.orderStatus]}</span></p>
</div>`;

    // Detalles del pedido
    invoiceHtml += '<div style="margin: 20px 0;">';
    invoiceHtml += '<h3>Detalles del pedido</h3>';
    invoiceHtml += '<table style="width: 100%; border-collapse: collapse;">';
    invoiceHtml += `
    <thead>
        <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Producto</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Cantidad</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Precio</th>
        </tr>
    </thead>
    <tbody>
`;

    orderData.cart.products.forEach((product) => {
      invoiceHtml += `<tr>
        <td style="border: 1px solid #ccc; padding: 8px;">
            <img src="${product.image}" alt="${product.name}" style="width: 50px; height: auto; margin-right: 10px; vertical-align: middle;" />
            ${product.name}
        </td>
        <td style="border: 1px solid #ccc; padding: 8px;">x ${product.quantity}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">S/. ${product.price.toFixed(2)}</td>
    </tr>`;
    });

    // Calcular total
    const totalPrice = orderData.cart.products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
    invoiceHtml += '</tbody></table>';
    invoiceHtml += '</div>'; // Cerrar detalles del pedido

    // Totales
    invoiceHtml += '<div style="margin: 20px 0;width:100%;">';
    invoiceHtml += '<h3>Totales</h3>';
    invoiceHtml += `
    <p style="text-align: right;">Subtotal: S/. ${totalPrice.toFixed(2)}</p>
    <p style="text-align: right;">Impuesto: S/. 0.00</p>
    <p style="font-weight: bold;text-align: right;">Total: S/. ${totalPrice.toFixed(2)}</p>
</div>`;

    // Información del cliente
    invoiceHtml += '<div style="margin: 20px 0; ">';
    invoiceHtml += '<h3>Información del cliente</h3>';
    invoiceHtml += `    
    <p style="text-transform: capitalize;"><strong>Cliente:</strong> ${orderData.client.name}</p>
    <p><strong>Correo electrónico:</strong> ${orderData.client.email}</p>
    <p><strong>Teléfono:</strong> ${orderData.client.phone}</p>
    
</div>`;

    // Pie de página
    invoiceHtml += '<div style="text-align: center; margin-top: 20px;">';
    invoiceHtml += `<p>© CHAQCHAO ${new Date().getFullYear()} </p>`;
    invoiceHtml += `<p style="font-size: 10px;">${new Date().toLocaleString()} </p>`;
    invoiceHtml += '</div>';

    // Devolver el HTML generado
    return invoiceHtml;
  }
}
