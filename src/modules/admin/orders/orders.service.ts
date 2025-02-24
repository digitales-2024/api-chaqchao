import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { OrderDetails, OrderInfo } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { numberToLetter } from 'src/utils/numberToLetter';
import { AdminGateway } from '../admin.gateway';

@Injectable()
export class OrdersService {
  private logger = new Logger('OrdersService');
  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminGateway: AdminGateway,
    private readonly eventEmitter: TypedEventEmitter
  ) {}

  async findAll(date: string, status?: OrderStatus): Promise<OrderInfo[]> {
    try {
      // Convertir la fecha a la zona horaria de Perú
      const formattedDate = new Date(date);

      if (isNaN(formattedDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      // Convertimos la fecha de búsqueda a UTC
      const searchDate = new Date(`${date}T00:00:00-05:00`); // Inicio del día en Perú
      const nextDay = new Date(`${date}T00:00:00-05:00`);
      nextDay.setDate(nextDay.getDate() + 1); // Final del día en Perú

      const start = searchDate;
      const end = nextDay;

      const orders = await this.prismaService.order.findMany({
        where: {
          pickupTime: {
            gte: start,
            lte: end
          },
          orderStatus: {
            ...(status === ('ALL' as unknown as OrderStatus)
              ? {
                  not: 'PENDING'
                }
              : { equals: status })
          }
        },
        include: {
          cart: {
            include: {
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
                include: {
                  product: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      },
                      images: {
                        orderBy: {
                          order: 'asc'
                        }
                      }
                    }
                  }
                }
              }
            }
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
        isShipping: order.isShipping,
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

  async findOne(id: string): Promise<OrderDetails> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: { id },
        include: {
          cart: {
            include: {
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
                include: {
                  product: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      },
                      images: {
                        orderBy: {
                          order: 'asc'
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
              typeDocument: true,
              businessName: true,
              paymentStatus: true
            }
          }
        }
      });

      return {
        id: order.id,
        orderStatus: order.orderStatus,
        pickupAddress: order.pickupAddress,
        pickupTime: order.pickupTime,
        isActive: order.isActive,
        someonePickup: order.someonePickup,
        isShipping: order.isShipping,
        pickupCode: order.pickupCode,
        totalAmount: order.totalAmount,
        cart: {
          quantity: order.cart.cartItems.reduce((acc, { quantity }) => acc + quantity, 0),
          products: order.cart.cartItems.map(({ product, quantity }) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            quantity,
            category: {
              id: product.category.id,
              name: product.category.name
            }
          }))
        },
        billingDocument: {
          billingDocumentType: order.billingDocument.billingDocumentType,
          documentNumber: order.billingDocument.documentNumber,
          address: order.billingDocument.address,
          state: order.billingDocument.state,
          country: order.billingDocument.country,
          city: order.billingDocument.city,
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
              lastName: order.customerLastName,
              phone: order.customerPhone,
              email: order.customerEmail
            }
      };
    } catch (error) {
      this.logger.error('Error get order', error.message);
      handleException(error, 'Error get order');
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const order = await this.prismaService.order.update({
        where: { id },
        data: {
          orderStatus: status
        },
        include: {
          cart: {
            include: {
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
                include: {
                  product: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      },
                      images: {
                        orderBy: {
                          order: 'asc'
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

      this.adminGateway.sendOrderStatusUpdated(order.id, order.orderStatus);

      if (order.orderStatus === OrderStatus.COMPLETED) {
        await this.eventEmitter.emitAsync('order.order-completed', {
          name: order.cart.client
            ? (order.cart.client.name + ' ' + order.cart.client.lastName).toUpperCase()
            : (order.customerName + ' ' + order.customerLastName).toUpperCase(),
          email: order.cart.client ? order.cart.client.email : order.customerEmail,
          orderNumber: order.pickupCode,
          totalOrder: order.totalAmount.toFixed(2),
          pickupDate: format(order.pickupTime, 'PPPp'),
          products: order.cart.cartItems.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            image: item.product.images[0]?.url || ''
          }))
        });
      }

      return order;
    } catch (error) {
      this.logger.error('Error update order status', error.message);
      handleException(error, 'Error update order status');
    }
  }

  async findByClient(id: string): Promise<OrderInfo[]> {
    try {
      const ordersByClient = await this.prismaService.order.findMany({
        where: {
          cart: {
            clientId: id
          }
        },
        include: {
          cart: {
            include: {
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
                include: {
                  product: {
                    include: {
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      },
                      images: {
                        orderBy: {
                          order: 'asc'
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

      return ordersByClient.map((order) => ({
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
      }));
    } catch (error) {
      this.logger.error('Error get orders by client', error.message);
      handleException(error, 'Error get orders by client');
    }
  }

  async exportPdf(id: string): Promise<{ code: string; pdfBuffer: Buffer }> {
    const order = await this.findOne(id);
    const templatePath = path.join(__dirname, '../../../../', 'templates', 'orderEnvoice.html');

    let templateHtml: string;
    try {
      templateHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('Error al leer la plantilla HTML:', error);
      throw new Error('No se pudo cargar la plantilla HTML.');
    }

    const business = await this.prismaService.businessConfig.findFirst({
      select: { address: true, businessName: true, ruc: true, contactNumber: true }
    });

    const orderHtml = this.generateOrderHtml(order, business);
    const htmlContent = templateHtml.replace('{{order}}', orderHtml);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4'
    });
    await browser.close();

    return { code: order.pickupCode, pdfBuffer: Buffer.from(pdfBuffer) };
  }

  private generateOrderHtml(orderData: OrderDetails, business): string {
    const totalPrice = orderData.cart.products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );

    let invoiceHtml = `
    <div style="max-width: 600px; margin: 20px auto; padding: 20px;">
      <h2 style="text-align: center; color: #000;">${
        orderData.billingDocument.billingDocumentType === 'INVOICE' ? 'Factura' : 'Boleta'
      }</h2>
      <p style="text-align: center; font-size: 16px; margin: 10px 0;"><strong>${
        business.businessName
      }</strong></p>
      <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>${
        business.address
      }</strong></p>
      <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>RUC: ${
        business.ruc
      }</strong></p>
      <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>Tel: ${
        business.contactNumber
      }</strong></p>
      <p style="text-align: center; font-size: 16px; margin: 10px 0;"><strong>PEDIDO # ${
        orderData.pickupCode
      }</strong></p>
    `;

    // Información del cliente
    invoiceHtml += this.generateClientInfoHtml(orderData);

    // Detalles del pedido
    invoiceHtml += this.generateOrderDetailsHtml(orderData);

    // Total y pie de página
    invoiceHtml += this.generateTotalAndFooterHtml(totalPrice);

    return invoiceHtml;
  }

  private generateClientInfoHtml(orderData: OrderDetails): string {
    return `
      <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6; margin-top: 20px;margin-bottom: 20px;"/>
      <div style="margin-top: 20px;">
        <h3 style="margin-bottom: 10px; color: #555; text-align: center;">Información del cliente</h3>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
          <p style="margin: 5px 0; display:flex; flex-direction:column;">
            <strong style="font-size:12px; color:#9da2ab">Cliente:</strong>
            ${orderData.client.name + ' ' + orderData.client.lastName}
          </p>
          <p style="margin: 5px 0;">
            <strong style="font-size:12px; color:#9da2ab">Correo electrónico:</strong>
            ${orderData.client.email}
          </p>
          <p style="margin: 5px 0; display:flex; flex-direction:column;">
            <strong style="font-size:12px; color:#9da2ab">Teléfono:</strong>
            ${orderData.client.phone}
          </p>
          <p></p>
          ${this.generateBillingInfoHtml(orderData)}
        </div>
        ${this.generateDateAndDividerHtml(orderData)}
      </div>
    `;
  }

  private generateBillingInfoHtml(orderData: OrderDetails): string {
    return `
      <p style="margin: 5px 0; display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">Tipo documento:</strong>
        ${orderData.billingDocument.typeDocument}
      </p>
      <p style="margin: 5px 0;display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">N° documento:</strong>
        ${orderData.billingDocument.documentNumber}
      </p>
      <p style="margin: 5px 0; display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">Dirección:</strong>
        ${orderData.billingDocument.address}
      </p>
      <p style="margin: 5px 0;display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">País:</strong>
        ${orderData.billingDocument.country}
      </p>
      <p style="margin: 5px 0;display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">Estado:</strong>
        ${orderData.billingDocument.state}
      </p>
      <p style="margin: 5px 0;display:flex; flex-direction:column;">
        <strong style="font-size:12px; color:#9da2ab">Ciudad:</strong>
        ${orderData.billingDocument.city}
      </p>
      ${
        orderData.billingDocument.billingDocumentType === 'INVOICE'
          ? `<p style="margin: 5px 0;">
              <strong style="font-size:12px; color:#9da2ab">Empresa:</strong>
              ${orderData.billingDocument.businessName}
            </p>`
          : ''
      }
    `;
  }

  private generateDateAndDividerHtml(orderData: OrderDetails): string {
    return `
      <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6; margin-top: 20px;margin-bottom: 20px;"/>
      <p style="margin: 5px 0; color: #777; text-align: center;">
        ${format(orderData.pickupTime, 'dd/MM/yyyy HH:mm:ss', { locale: es })}
      </p>
      <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;"/>
    `;
  }

  private generateOrderDetailsHtml(orderData: OrderDetails): string {
    let html = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px; font-size: 18px;">Detalles del pedido</h3>
        <table style="width: 100%; font-size: 14px;">
          <thead>
            <tr>
              <th style="padding: 8px; color: #758399">Artículo</th>
              <th style="padding: 8px; color: #758399">Cant.</th>
              <th style="padding: 8px; color: #758399">P.U</th>
              <th style="padding: 8px; color: #758399">Importe</th>
            </tr>
          </thead>
          <tbody>
    `;

    orderData.cart.products.forEach((product) => {
      const importe = (product.price * product.quantity).toFixed(2);
      html += `
        <tr>
          <td style="padding: 8px; text-align: left;">
            <img src="${
              product.images[0]?.url || ''
            }" alt="${product.name}" style="width: 40px; height: auto; margin-right: 10px; vertical-align: middle;" />
            ${product.name}
          </td>
          <td style="padding: 8px; text-align: center;">${product.quantity}</td>
          <td style="padding: 8px; text-align: center;">S/. ${product.price.toFixed(2)}</td>
          <td style="padding: 8px; text-align: center;">S/. ${importe}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  private generateTotalAndFooterHtml(totalPrice: number): string {
    return `
      <div style="text-align: right; margin-top: 20px; font-size: 16px;">
        <p style="margin-bottom: 5px; display:flex;justify-content: space-between;">
          <strong>Total venta:</strong>
          <span>S/. ${totalPrice.toFixed(2)}</span>
        </p>
      </div>
      <p style="margin-bottom: 5px; text-align: center;">Son ${numberToLetter(totalPrice)}</p>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items:center;">
        <div style="height: 1px; width: 100%; border-top: 1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;"></div>
        <p style="text-align: center;">Forma de pago</p>
        <div style="height: 1px; width: 100%; border-top: 1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;"></div>
      </div>
      <p style="margin-bottom: 5px; display:flex;justify-content: space-between;">
        <strong>Izipay</strong>
        <span>S/. ${totalPrice.toFixed(2)}</span>
      </p>
    </div>
    `;
  }
}
