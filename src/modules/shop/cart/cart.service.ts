import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CartStatus, DayOfWeek, OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { writeFileSync } from 'fs';
import * as PDFDocument from 'pdfkit';
import { MAX_QUANTITY } from '../../../constants/cart';
import { TypedEventEmitter } from '../../../event-emitter/typed-event-emitter.class';
import { CartData, HttpResponse, ProductData } from '../../../interfaces';
import { CartDataComplet } from '../../../interfaces/cart.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { handleException } from '../../../utils';
import { AdminGateway } from '../../admin/admin.gateway';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartDto } from './dto/cart.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeleteItemDto } from './dto/delete-item';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { PickupCodeService } from './pickup-code/pickup-code.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pickupCodeService: PickupCodeService,
    private readonly eventEmitter: TypedEventEmitter,
    private readonly orderGateway: AdminGateway
  ) {}

  /**
   * Mostrar todos los carts
   * @returns Todos los carts
   */
  async findAll(): Promise<CartData[]> {
    try {
      const carts = await this.prisma.cart.findMany({
        where: {},
        select: {
          id: true,
          cartStatus: true,
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Mapea los resultados al tipo CartData
      return carts.map((cart) => ({
        id: cart.id,
        cartStatus: cart.cartStatus,
        client: cart.client
      })) as CartData[];
    } catch (error) {
      this.logger.error('Error getting all carts');
      handleException(error, 'Error getting all carts');
    }
  }

  /**
   * Crear un nuevo carrito.
   * @param createCartDto Datos para crear el carrito.
   */
  async createCart(createCartDto: CreateCartDto): Promise<{ id: string }> {
    const { cartStatus = CartStatus.PENDING, tempId, clientId } = createCartDto;

    // Verificar si el cliente autenticado ya tiene un carrito activo
    if (clientId) {
      const existingCart = await this.prisma.cart.findFirst({
        where: {
          clientId: clientId,
          cartStatus: CartStatus.PENDING
        }
      });

      if (existingCart) {
        throw new BadRequestException('The client already has an active cart.');
      }
    } else if (tempId) {
      const existingCart = await this.prisma.cart.findFirst({
        where: {
          tempId: tempId,
          cartStatus: CartStatus.PENDING
        }
      });

      if (existingCart) {
        throw new BadRequestException('A cart with this tempId already exists.');
      }
    }

    const cart = await this.prisma.cart.create({
      data: {
        clientId: clientId || null,
        tempId: tempId || null,
        cartStatus
      }
    });
    return { id: cart.id };
  }

  /**
   * Obtener un carrito por su ID.
   * @param id ID del carrito.
   * @param requesterClientId ID del cliente que realiza la solicitud (opcional).
   */
  async getCartById(id: string, requesterClientId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: { cartItems: true }
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    if (cart.clientId && requesterClientId !== cart.clientId) {
      throw new ForbiddenException('You do not have access to this cart.');
    }

    return cart;
  }

  /**
   * Agregar un ítem al carrito.
   * @param cartId ID del carrito.
   * @param addCartItemDto Datos del ítem a agregar.
   */
  async addItemToCart(cartId: string, addCartItemDto: AddCartItemDto) {
    const { productId, quantity = 1, clientId } = addCartItemDto;

    const cart = await this.prisma.cart.findUnique({
      where: { tempId: cartId },
      include: { cartItems: true }
    });

    // Verificar si el carrito es válido
    if (!cart || cart.cartStatus !== CartStatus.PENDING) {
      throw new BadRequestException('Invalid or inactive cart.');
    }

    if (cart.clientId && clientId !== cart.clientId) {
      throw new ForbiddenException('You do not have permission to modify this cart.');
    }

    // Actualizar lastAccessed
    await this.prisma.cart.update({
      where: { tempId: cartId },
      data: { lastAccessed: new Date() }
    });

    const existingItem = cart.cartItems.find((item) => item.productId === productId);
    if (existingItem) {
      // Actualizar la cantidad del ítem existente
      const newQuantity = existingItem.quantity + quantity;
      if (MAX_QUANTITY < newQuantity) {
        throw new BadRequestException('Not enough stock for the product.');
      }

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Verificar si el producto existe y tiene stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new BadRequestException('Product not found.');
      }

      if (MAX_QUANTITY < quantity) {
        throw new BadRequestException('Not enough stock for the product.');
      }

      // Crear un nuevo ítem en el carrito
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price
        }
      });
    }
  }

  /**
   * Actualizar la cantidad de un ítem en el carrito.
   * @param cartId ID del carrito.
   * @param cartItemId ID del ítem en el carrito.
   * @param updateCartItemDto Datos para actualizar el ítem.
   * @param clientId ID del cliente autenticado (opcional).
   */
  async updateCartItem(cartId: string, cartItemId: string, updateCartItemDto: UpdateCartItemDto) {
    const { quantity, clientId } = updateCartItemDto;

    const cart = await this.prisma.cart.findUnique({
      where: { tempId: cartId },
      include: { cartItems: true }
    });

    if (!cart || cart.cartStatus !== CartStatus.PENDING) {
      throw new BadRequestException('Invalid or inactive cart.');
    }

    const cartItem = cart.cartItems.find((item) => item.productId === cartItemId);
    if (!cartItem) {
      throw new BadRequestException('Cart item not found.');
    }

    if (cart.clientId && clientId !== cart.clientId) {
      throw new ForbiddenException('You do not have permission to modify this cart.');
    }

    // Actualizar lastAccessed
    await this.prisma.cart.update({
      where: { tempId: cartId },
      data: { lastAccessed: new Date() }
    });

    if (quantity < 1) {
      // Eliminar el ítem si la cantidad es menor que 1
      return this.prisma.cartItem.delete({
        where: { id: cartItem.id }
      });
    }

    // Verificar stock disponible
    const product = await this.prisma.product.findUnique({
      where: { id: cartItem.productId }
    });

    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    if (MAX_QUANTITY < quantity) {
      throw new BadRequestException('Not enough stock for the product.');
    }

    // Actualizar la cantidad del ítem
    return this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity }
    });
  }

  /**
   * Eliminar un ítem del carrito.
   * @param cartId ID del carrito.
   * @param cartItemId ID del ítem en el carrito.
   * @param deleteItem ID del cliente autenticado (opcional).
   */
  async removeCartItem(cartId: string, cartItemId: string, deleteItem: DeleteItemDto) {
    const { clientId } = deleteItem;

    const cart = await this.prisma.cart.findUnique({
      where: { tempId: cartId },
      include: { cartItems: true }
    });

    if (!cart || cart.cartStatus !== CartStatus.PENDING) {
      throw new BadRequestException('Invalid or inactive cart.');
    }

    const cartItem = cart.cartItems.find((item) => item.productId === cartItemId);
    if (!cartItem) {
      throw new BadRequestException('Cart item not found.');
    }

    if (cart.clientId && clientId !== cart.clientId) {
      throw new ForbiddenException('You do not have permission to modify this cart.');
    }

    // Actualizar lastAccessed
    await this.prisma.cart.update({
      where: { tempId: cartId },
      data: { lastAccessed: new Date() }
    });

    return this.prisma.cartItem.delete({
      where: { id: cartItem.id }
    });
  }

  /**
   * Completar la compra del carrito y crear una orden.
   * @param cartId ID del carrito.
   * @param createOrderDto Datos para crear la orden.
   * @param clientId ID del cliente autenticado (opcional).
   */
  async completeCart(cartId: string, createOrderDto: CreateOrderDto) {
    const { clientId } = createOrderDto;

    const cart = await this.prisma.cart.findUnique({
      where: { tempId: cartId },
      include: { cartItems: true }
    });

    if (!cart || cart.cartStatus !== CartStatus.PENDING) {
      throw new BadRequestException('Invalid or inactive cart.');
    }

    if (cart.clientId && clientId !== cart.clientId) {
      throw new ForbiddenException('You do not have permission to complete this cart.');
    }

    if (cart.cartItems.length === 0) {
      throw new BadRequestException('The cart is empty.');
    }

    for (const item of cart.cartItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new BadRequestException(`Product with ID ${item.productId} not found.`);
      }

      if (MAX_QUANTITY < item.quantity) {
        throw new BadRequestException(`Not enough stock for the product ${product.name}.`);
      }
    }

    // Calcular el monto total
    const totalAmount = cart.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Obtener la dirección de la empresa
    const bussinessAddress = await this.prisma.businessConfig.findFirst({
      select: {
        address: true
      }
    });

    // Generar el pickupCode
    const pickupCode = await this.pickupCodeService.generatePickupCode();

    // Si viene en UTC (con Z), convertimos a hora Perú
    const pickupDateInPeru = createOrderDto.pickupTime.endsWith('Z')
      ? new Date(new Date(createOrderDto.pickupTime).getTime() - 5 * 60 * 60 * 1000)
      : new Date(createOrderDto.pickupTime); // Ya está en hora Perú

    // Obtener día y hora de pickup en Perú
    const dayOfWeek = format(pickupDateInPeru, 'EEEE').toUpperCase() as DayOfWeek;
    const pickupTimeStr = format(pickupDateInPeru, 'HH:mm');

    // Verificar horario de atención para ese día
    const businessHours = await this.prisma.businessHours.findFirst({
      where: { dayOfWeek, isOpen: true }
    });

    if (!businessHours) {
      throw new BadRequestException(`The business is closed on ${dayOfWeek.toLowerCase()}s.`);
    }

    // Obtener hora actual en Perú
    const nowInPeru = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const currentTimeStr = format(nowInPeru, 'HH:mm');

    // Validar que no sea en el pasado si es el mismo día
    if (format(pickupDateInPeru, 'yyyy-MM-dd') === format(nowInPeru, 'yyyy-MM-dd')) {
      if (pickupTimeStr < currentTimeStr) {
        throw new BadRequestException('Orders cannot be placed in the past.');
      }
    }

    // Validar horario de atención
    if (pickupTimeStr < businessHours.openingTime || pickupTimeStr > businessHours.closingTime) {
      throw new BadRequestException(
        `Orders can only be placed between ${businessHours.openingTime} and ${businessHours.closingTime} (Peru time).`
      );
    }

    // Verificamos que no haya una orden pendiente del mismo cart
    const existingOrder = await this.prisma.order.findFirst({
      where: { cartId: cart.id, orderStatus: OrderStatus.PENDING }
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Crear la orden
    const order = await this.prisma.order.create({
      data: {
        cartId: cart.id,
        customerName: createOrderDto.customerName,
        customerLastName: createOrderDto.customerLastName || '',
        customerEmail: createOrderDto.customerEmail,
        customerPhone: createOrderDto.customerPhone || '',
        someonePickup: createOrderDto.someonePickup,
        comments: createOrderDto.comments || '',
        // Usamos la misma fecha con offset que ya validamos arriba
        pickupTime: pickupDateInPeru,
        pickupCode: pickupCode,
        totalAmount: totalAmount,
        orderStatus: OrderStatus.PENDING,
        pickupAddress: bussinessAddress.address || ''
      }
    });

    return order;
  }

  /**
   * Completar la compra del carrito y crear una orden.
   * @param cartId  ID del carrito
   * @param invoice Datos de la factura
   * @returns     Respuesta de la operación.
   */
  async checkoutCart(cartId: string, invoice: CreateInvoiceDto) {
    try {
      // Buscar el carrito y sus ítems asociados
      const cart = await this.prisma.cart.findUnique({
        where: { tempId: cartId },
        include: { cartItems: true, order: true, client: true }
      });
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }
      if (cart.cartItems.length === 0) {
        throw new BadRequestException('The cart is empty.');
      }

      // Actualizar el estado de la order a confirmado / osea pagado
      const order = await this.prisma.order.update({
        where: { id: cart.order.id },
        data: { orderStatus: OrderStatus.CONFIRMED }
      });

      // Actualizar el estado del carrito a COMPLETED y vincular la orden
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: {
          cartStatus: CartStatus.COMPLETED,
          orderId: cart.orderId
        }
      });

      const invoiceData = {
        orderId: order.id,
        billingDocumentType: invoice.billingDocumentType,
        typeDocument: invoice.typeDocument,
        documentNumber: invoice.documentNumber,
        address: invoice.address,
        country: invoice.country,
        state: invoice.state,
        city: invoice.city,
        postalCode: invoice.postalCode,
        paymentStatus: invoice.paymentStatus,
        totalAmount: order.totalAmount,
        issuedAt: new Date(),
        businessName: invoice.businessName
      };

      const billingExists = await this.prisma.billingDocument.findFirst({
        where: { orderId: order.id }
      });

      if (billingExists) {
        throw new BadRequestException('The invoice already exists for this order.');
      }

      await this.prisma.billingDocument.create({
        data: invoiceData
      });

      // Enviar un correo para notificar al cliente que su pedido ha sido confirmado

      // Enviamos el usuario al correo con la contraseña temporal
      const emailResponse = await this.eventEmitter.emitAsync('order.new-order', {
        name: cart.client
          ? (cart.client.name + ' ' + cart.client.lastName).toUpperCase()
          : (order.customerName + ' ' + order.customerLastName).toUpperCase(),
        email: cart.client ? cart.client.email : order.customerEmail,
        orderNumber: order.pickupCode,
        totalOrder: order.totalAmount.toFixed(2),
        pickupDate: format(order.pickupTime, 'PPPp')
      });

      if (emailResponse.every((response) => response !== true)) {
        throw new BadRequestException('Failed to send email');
      }

      // Emitir evento para notificar al administrador
      this.orderGateway.sendOrderCreated(order);
    } catch (error) {
      this.logger.error(`Error during checkout: ${error.message}`, error.stack);
      handleException(error, 'Error during checkout');
    }
  }

  /**
   * Eliminar un carrito.
   * @param cartId ID del carrito.
   * @param clientId ID del cliente autenticado (opcional).
   */
  async deleteCart(cartId: string, clientId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId }
    });

    if (!cart) {
      throw new BadRequestException('Cart not found.');
    }

    if (cart.clientId && clientId !== cart.clientId) {
      throw new ForbiddenException('You do not have permission to delete this cart.');
    }

    return this.prisma.cart.delete({
      where: { id: cartId }
    });
  }

  /**
   * Fusión de carritos al autenticarse.
   * @param anonCartId ID del carrito anónimo.
   * @param authClientId ID del cliente autenticado.
   */
  async mergeCarts(anonCartId: string, authClientId: string) {
    const anonCart = await this.prisma.cart.findUnique({
      where: { id: anonCartId },
      include: { cartItems: true }
    });

    if (!anonCart || anonCart.cartStatus !== CartStatus.PENDING) {
      throw new BadRequestException('Invalid or inactive anonymous cart.');
    }

    const authCart = await this.prisma.cart.findFirst({
      where: {
        clientId: authClientId,
        cartStatus: CartStatus.PENDING
      },
      include: { cartItems: true }
    });

    if (authCart) {
      // Fusionar ítems
      for (const anonItem of anonCart.cartItems) {
        const existingItem = authCart.cartItems.find(
          (item) => item.productId === anonItem.productId
        );
        if (existingItem) {
          // Actualizar cantidad
          await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + anonItem.quantity }
          });
        } else {
          // Transferir ítem al carrito autenticado
          await this.prisma.cartItem.update({
            where: { id: anonItem.id },
            data: { cartId: authCart.id }
          });
        }
      }

      // Eliminar el carrito anónimo
      await this.prisma.cart.delete({
        where: { id: anonCartId }
      });

      return authCart;
    } else {
      // Asignar el carrito anónimo al cliente autenticado
      return this.prisma.cart.update({
        where: { id: anonCartId },
        data: { clientId: authClientId }
      });
    }
  }

  /**
   * Valida si es que existe el carrito de compras por id
   * @param id Id del carrito
   * @returns Si existe el carrito de compras te retorna el mensaje de error si no te retorna el cliente
   */
  async findById(id: string): Promise<CartData> {
    const cartDB = await this.prisma.cart.findFirst({
      where: { id },
      select: {
        id: true,
        clientId: true,
        cartStatus: true,
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!cartDB) {
      throw new BadRequestException('This cart doesnt exist');
    }
    if (!!cartDB && !cartDB.cartStatus) {
      throw new BadRequestException('This cart exist, but is inactive');
    }

    // Mapeo al tipo CartData
    return {
      id: cartDB.id,
      clientId: cartDB.clientId,
      cartStatus: cartDB.cartStatus,
      client: {
        id: cartDB.client.id,
        name: cartDB.client.name
      }
    };
  }

  /**
   * Validar si el cliente tiene un carrito activo
   * @param clientId ID del cliente
   * @returns Si el cliente tiene un carrito activo
   */
  async checkCart(clientId: string): Promise<boolean> {
    try {
      // Buscar un carrito activo para el cliente
      const cart = await this.prisma.cart.findFirst({
        where: {
          clientId,
          cartStatus: CartStatus.PENDING
        }
      });

      return !!cart;
    } catch (error) {
      this.logger.error(`Error checking cart: ${error.message}`, error.stack);
      handleException(error, 'Error checking cart');
    }
  }

  /**
   * Buscar carrito por ID y obtener sus ítems asociados
   * @param id Identificador del carrito
   * @returns Carrito con sus ítems
   */
  async findByIdWithItems(id: string): Promise<HttpResponse<any>> {
    try {
      // Buscar carrito y sus ítems
      const cart = await this.prisma.cart.findUnique({
        where: { id },
        select: {
          id: true,
          clientId: true,
          cartStatus: true,
          client: {
            select: {
              id: true,
              name: true
            }
          },
          cartItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      // Si no se encuentra el carrito, lanzar excepción
      if (!cart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
      }

      // Calcular totalAmount sumando (precio del ítem * cantidad)
      const totalAmount = cart.cartItems.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);

      return {
        statusCode: 200,
        message: 'Cart retrieved successfully',
        data: {
          id: cart.id,
          clientId: cart.clientId,
          cartStatus: cart.cartStatus,
          totalAmount,
          client: {
            id: cart.client.id,
            name: cart.client.name
          },
          items: cart.cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            finalprice: item.price,
            product: {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price
            }
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Error retrieving cart with items: ${error.message}`, error.stack);
      handleException(error, 'Error retrieving cart with items');
    }
  }

  /**
   * Buscar carrito por ID y lo cancela
   * @param id Identificador del carrito
   * @returns Vacio con mensaje de Cancelado
   */
  async cancelCart(id: string): Promise<HttpResponse<any>> {
    try {
      // Validar el carrito
      const cart = await this.prisma.cart.findUnique({
        where: { id }
      });

      if (!cart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
      }

      if (cart.cartStatus !== CartStatus.PENDING) {
        throw new BadRequestException('Cart is not in a valid state for cancellation');
      }

      // Eliminar los cartItems relacionados primero
      await this.prisma.cartItem.deleteMany({
        where: { cartId: id }
      });

      // Actualizar el estado del carrito a CANCELLED (o eliminar el carrito)
      const cartDelete: CartData = await this.prisma.cart.delete({
        where: { id },
        select: {
          id: true,
          clientId: true,
          cartStatus: true,
          client: {
            select: {
              id: true,
              name: true
            }
          },
          cartItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Cart cancelled successfully',
        data: cartDelete
      };
    } catch (error) {
      this.logger.error(`Error during cart cancellation: ${error.message}`, error.stack);
      handleException(error, 'Error during cart cancellation');
    }
  }

  /**
   * Generamos la boleta o factura con tabla, header y footer
   * @param cart carrito para obtener los detalles
   * @returns los detalles del carrito en formato boleta o factura en pdf
   */
  async generateInvoice(cart: any): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = `./invoices/invoice_${cart.id}.pdf`;

    // Convertir el PDF en un buffer y escribirlo en un archivo
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      writeFileSync(filePath, pdfData);
    });

    // Encabezado
    this.generateHeader(doc, cart);

    // Tabla con los detalles de los productos
    this.generateTable(doc, cart);

    // Pie de página
    this.generateFooter(doc);

    // Finalizar el documento PDF
    doc.end();

    return filePath;
  }

  /**
   * Genera el encabezado del PDF
   * @param doc documento PDF
   * @param cart datos del carrito para mostrar información del cliente
   */
  generateHeader(doc: any, cart: any) {
    try {
      // Intenta cargar la imagen
      doc.image('images/chaqchao_logo_1.png', 50, 45, { width: 50 });
    } catch (error) {
      // Manejo de error si la imagen no se puede cargar
      console.error('Error loading image: ', error.message);
      doc.fontSize(12).text('Chaqchao Logo', 50, 57); // Texto alternativo si no se carga la imagen
    }
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('Chaqchao Chocolates', 110, 57)
      .fontSize(10)
      .text('Chaqchao Chocolates', 200, 50, { align: 'right' })
      .text('Calle 123, Arequipa, Perú', 200, 65, { align: 'right' })
      .text('Tel: +51 999 999 999', 200, 80, { align: 'right' })
      .moveDown();

    doc.text('                       ', 70, 110);
    doc.text('__________________________________________________________________________', 70, 110);

    doc
      .fillColor('#000000')
      .fontSize(14)
      .text(`Factura/Boleta: ${cart.id}`, { align: 'left' })
      .text(`Cliente: ${cart.client.name}`, { align: 'left' })
      .moveDown();

    doc.text('_____________________________________________________', 70, 145);
  }

  /**
   * Genera la tabla con los ítems del carrito
   * @param doc documento PDF
   * @param cart datos del carrito para mostrar los ítems
   */
  generateTable(doc: any, cart: any) {
    const tableTop = 200;
    const itemX = 50;
    const quantityX = 300;
    const priceX = 400;

    doc.fontSize(12).text('Items', itemX, tableTop);
    doc.text('Cantidad', quantityX, tableTop);
    doc.text('Precio Unitario', priceX, tableTop);

    let position = tableTop + 20;

    if (cart.cartItems && Array.isArray(cart.cartItems)) {
      cart.cartItems.forEach((item: any) => {
        doc.fontSize(10).text(item.product.name, itemX, position);
        doc.text(item.quantity.toString(), quantityX, position);
        doc.text(`S/. ${item.product.price}`, priceX, position);
        position += 20;
      });

      // Calcular el total de la factura
      const totalPrice = cart.cartItems.reduce((sum: number, item: any) => {
        return sum + item.quantity * item.product.price;
      }, 0);

      doc.fontSize(12).text(`Total: $${totalPrice}`, priceX, position + 20);
    } else {
      doc.fontSize(10).text('No se encontraron ítems en el carrito.', itemX, position);
    }
  }

  /**
   * Genera el pie de página del PDF
   * @param doc documento PDF
   */
  generateFooter(doc: any) {
    doc
      .fontSize(10)
      .text('Gracias por su compra.', 50, 700, { align: 'center', width: 500 })
      .text('Visítanos en: www.chaqchao-chocolates.com', { align: 'center' });
  }

  /**
   * Generamos la factura o boleta sin enviar correos
   * @param cartId ID del carrito de compras
   * @returns el archivo PDF generado
   */
  async generateAndSendInvoice(cartId: string): Promise<HttpResponse<any>> {
    try {
      // Buscar carrito y sus ítems asociados
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        select: {
          id: true,
          clientId: true,
          cartStatus: true,
          client: {
            select: {
              id: true,
              name: true
            }
          },
          cartItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (!cart) {
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }

      // Generar factura en PDF
      const filePath = await this.generateInvoice(cart);

      return {
        statusCode: 200,
        message: 'Invoice generated successfully',
        data: { invoicePath: filePath }
      };
    } catch (error) {
      this.logger.error(`Error generating invoice: ${error.message}`, error.stack);
      handleException(error, 'Error generating invoice');
    }
  }

  /**
   * Validar que todos los productos del carrito estén disponibles
   * @param cart Carrito de compras
   * @returns Si todos los productos están disponibles
   * @throws Error si no todos los productos están disponibles
   */
  async validateCartItems(cart: CartDto): Promise<HttpResponse<ProductData[]>> {
    // Validar que todos los productos estén disponibles
    const unavailableProducts = await this.prisma.product.findMany({
      where: {
        id: {
          in: cart.cartItems.map((item) => item)
        },
        isAvailable: false
      },
      select: {
        id: true
      }
    });

    if (unavailableProducts.length > 0) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'available',
        data: unavailableProducts
      });
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Checkout successfully',
      data: []
    };
  }

  /**
   * Buscar carrito por tempId
   * @param tempId Temporal ID del carrito
   * @returns Carrito encontrado
   */
  async getCartByTempId(tempId: string): Promise<CartDataComplet | boolean> {
    try {
      // Buscar el carrito por tempId
      const cart = await this.prisma.cart.findFirst({
        where: {
          tempId
        },
        select: {
          id: true,
          clientId: true,
          cartStatus: true,
          cartItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (!cart) {
        return false;
      }

      return {
        id: cart.id,
        clientId: cart.clientId,
        cartStatus: cart.cartStatus,
        items: cart.cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          productId: item.product.id
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting cart by tempId: ${error.message}`, error.stack);
      handleException(error, 'Error getting cart by tempId');
    }
  }

  /**
   * Cron para poder eliminar aquellos carritos que no han sido utilizados en 24 horas y que estén en estado PENDING
   */
  @Cron('0 0 1 * *') // Se ejecuta cada minuto
  async handleCron() {
    try {
      // Buscar carritos pendientes que no han sido utilizados en 24 horas
      const carts = await this.prisma.cart.findMany({
        where: {
          cartStatus: CartStatus.PENDING,
          lastAccessed: {
            lt: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000) // Hace 15 dias
          }
        },
        select: {
          id: true
        }
      });
      // Eliminamos los items de los carritos encontrados
      for (const cart of carts) {
        await this.prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });
      }

      // Eliminar los carritos encontrados
      for (const cart of carts) {
        await this.prisma.cart.delete({
          where: { id: cart.id }
        });
      }
    } catch (error) {
      this.logger.error(`Error during cron job: ${error.message}`, error.stack);
      handleException(error, 'Error during cron job');
    }
  }
}
