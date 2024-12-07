import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AdminGateway } from '../admin.gateway';
import { OrderDetails, OrderInfo } from 'src/interfaces';
import * as fs from 'fs';
import { numberToLetter } from 'src/utils/numberToLetter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Injectable()
export class OrdersService {
  private logger = new Logger('OrdersService');
  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminGateway: AdminGateway,
    private readonly eventEmitter: TypedEventEmitter
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
        },
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
        }
      });

      this.adminGateway.sendOrderStatusUpdated(order.id, order.orderStatus);

      // Verficamos que cuando se cambie a estado COMPLETED se envie el correo
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
            image: item.product.image
          }))
        });
      }

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
    const business = await this.prismaService.businessConfig.findFirst({
      select: { address: true, businessName: true, ruc: true, contactNumber: true }
    });

    const orderHtml = this.generateOrderHtml(order, business);

    const htmlContent = templateHtml.replace('{{order}}', orderHtml);

    // Generar el archivo PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    // Formato de boleta
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4'
    });
    await browser.close();

    // Convertir Uint8Array a Buffer
    return { code: order.pickupCode, pdfBuffer: Buffer.from(pdfBuffer) };
  }

  /**
   * Generar el contenido HTML del pedido
   * @param order  Pedido
   * @returns  Contenido HTML
   */
  private generateOrderHtml(orderData: OrderDetails, business): string {
    // Calcular total
    const totalPrice = orderData.cart.products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );

    // Encabezado principal
    let invoiceHtml = `
<div style="max-width: 600px; margin: 20px auto; padding: 20px;">
  <h2 style="text-align: center; color: #000;">${orderData.billingDocument.billingDocumentType === 'INVOICE' ? 'Factura' : 'Boleta'}</h2>
  <p style="text-align: center; font-size: 16px; margin: 10px 0;"><strong>${business.businessName}</strong></p>
  <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>${business.address}</strong></p>
  <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>RUC: ${business.ruc}</strong></p>
  <p style="text-align: center; font-size: 12px; margin: 10px 0;"><strong>Tel: ${business.contactNumber}</strong></p>
  <p style="text-align: center; font-size: 16px; margin: 10px 0;"><strong>PEDIDO # ${orderData.pickupCode}</strong></p>
`;

    // Información del cliente
    invoiceHtml += `
    <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6; margin-top: 20px;margin-bottom: 20px;"/>
  <div style="margin-top: 20px;">
            <h3 style="margin-bottom: 10px; color: #555; text-align: center;">Información del cliente</h3>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));">
                    <p style="margin: 5px 0; display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Cliente:</strong>${orderData.client.name + ' ' + orderData.client.lastName}</p>
                    <p style="margin: 5px 0;"><strong style="font-size:12px; color:#9da2ab">Correo electrónico:</strong> ${orderData.client.email}</p>
                    <p style="margin: 5px 0; display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Teléfono:</strong> ${orderData.client.phone}</p>
                    <p></p>
                    <p style="margin: 5px 0; display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Tipo documento:</strong> ${orderData.billingDocument.typeDocument}</p>
                    <p style="margin: 5px 0;display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">N° documento:</strong>${orderData.billingDocument.documentNumber}</p>
                    <p style="margin: 5px 0; display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Dirección:</strong> ${orderData.billingDocument.address}</p>
                    <p style="margin: 5px 0;display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">País:</strong>${orderData.billingDocument.country}</p>
                    <p style="margin: 5px 0;display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Estado:</strong> ${orderData.billingDocument.state}</p>
                    <p style="margin: 5px 0;display:flex; flex-direction:column;"><strong style="font-size:12px; color:#9da2ab">Ciudad:</strong>${orderData.billingDocument.city}</p>
            </div>
            
            ${
              orderData.billingDocument.billingDocumentType === 'INVOICE'
                ? `<p style="margin: 5px 0;"><strong style="font-size:12px; color:#9da2ab">Empresa:</strong>${orderData.billingDocument.businessName}</p>`
                : ''
            }
                <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6; margin-top: 20px;margin-bottom: 20px;"/>
                <p style="margin: 5px 0; color: #777; text-align: center;">${format(
                  orderData.pickupTime,
                  'dd/MM/yyyy HH:mm:ss',
                  {
                    locale: es
                  }
                )}</p>
                <div style="height: 1px; width:100%; border-top:1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;"/>
        </div>
`;

    // Detalles del pedido
    invoiceHtml += `
  <div style="margin-bottom: 20px;">
    <h3 style="margin-bottom: 10px; font-size: 18px;">Detalles del pedido</h3>
    <table style="width: 100%; font-size: 14px;">
      <thead>
        <tr>
          <th style="padding: 8px; color: #758399 ">Artículo</th>
          <th style="padding: 8px; color: #758399 ">Cant.</th>
          <th style="padding: 8px; color: #758399 ">P.U</th>
          <th style="padding: 8px; color: #758399 ">Importe</th>
        </tr>
      </thead>
      <tbody>
`;

    orderData.cart.products.forEach((product) => {
      const importe = (product.price * product.quantity).toFixed(2);
      invoiceHtml += `
        <tr>
          <td style="padding: 8px; text-align: left;">
            <img src="${product.image}" alt="${product.name}" style="width: 40px; height: auto; margin-right: 10px; vertical-align: middle;" />
            ${product.name}
          </td>
          <td style="padding: 8px; text-align: center;">${product.quantity}</td>
          <td style="padding: 8px; text-align: center;">S/. ${product.price.toFixed(2)}</td>
          <td style="padding: 8px; text-align: center;">S/. ${importe}</td>
        </tr>
    `;
    });

    invoiceHtml += `
      </tbody>
    </table>
  </div>
`;

    // Total y pie de página
    invoiceHtml += `
  <div style="text-align: right; margin-top: 20px; font-size: 16px;">
    <p style="margin-bottom: 5px; display:flex;justify-content: space-between;"><strong>Total venta:</strong> 
    <span>
    S/. ${totalPrice.toFixed(2)}
    </span>
    </p>
    </div>
    
    <p style="margin-bottom: 5px; text-align: center;">Son ${numberToLetter(totalPrice)}</p>
      <div
      style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items:center;"
    >
      <div style="height: 1px; width: 100%; border-top: 1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;" ></div>
      <p style="text-align: center;">Forma de pago</p>
      <div style="height: 1px; width: 100%; border-top: 1px dashed #a8acb6;margin-top: 20px;margin-bottom: 20px;" ></div>
    </div>
    <p style="margin-bottom: 5px; display:flex;justify-content: space-between;"><strong>Izipay</strong> 
    <span>
    S/. ${totalPrice.toFixed(2)}
    </span>
    </p>
    </div>
`;

    return invoiceHtml;
  }
}
