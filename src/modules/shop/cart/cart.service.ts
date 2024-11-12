import {
  Injectable,
  Logger,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartData, HttpResponse, ProductData } from 'src/interfaces';
import { ClientService } from '../client/client.service';
import { handleException } from 'src/utils';
import * as PDFDocument from 'pdfkit';
import { writeFileSync } from 'fs';
import { CartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ClientService))
    private readonly clientService: ClientService
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
   * Creacion de un nuevo carrito de compras
   * @param createCartDto Data del carrito de compras
   * @param user Usuario que crea el carrito de compras
   * @returns Carrito de compras creado
   */
  async create(createCartDto: CreateCartDto): Promise<HttpResponse<CartData>> {
    const { clientId, cartStatus = 'PENDING' } = createCartDto;
    let newCart;

    try {
      // Validar el cliente si se proporciona un clientId
      if (clientId) {
        const cartDB = await this.clientService.findById(clientId);
        if (!cartDB) {
          throw new BadRequestException('Invalid clientId provided');
        }
      }

      // Crear el carro de compras
      newCart = await this.prisma.$transaction(async () => {
        // Crear el nuevo carro de compras
        const cart = await this.prisma.cart.create({
          data: {
            clientId,
            cartStatus: cartStatus || 'PENDING' // Pone PENDING si el status no es proveido
          },
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

        return cart;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Cart created successfully',
        data: {
          id: newCart.id,
          clientId: newCart.clientId,
          cartStatus: newCart.cartStatus,
          client: {
            id: newCart.client.id,
            name: newCart.client.name
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Cart: ${error.message}`, error.stack);

      if (newCart) {
        await this.prisma.cart.delete({ where: { id: newCart.id } });
        this.logger.error('Cart with ID ${newCart.id} has been deleted due to error in creation.');
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a Cart');
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

      if (cart.cartStatus !== 'ACTIVE') {
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
}
