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
import { CartData, HttpResponse } from 'src/interfaces';
import { ClientService } from '../client/client.service';
import { handleException } from 'src/utils';

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

      // Mapea los resultados al tipo ProductData
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

      return {
        statusCode: 200,
        message: 'Cart retrieved successfully',
        data: {
          id: cart.id,
          clientId: cart.clientId,
          cartStatus: cart.cartStatus,
          client: {
            id: cart.client.id,
            name: cart.client.name
          },
          items: cart.cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
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
      // 1. Validar el carrito
      const cart = await this.prisma.cart.findUnique({
        where: { id }
      });

      if (!cart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
      }

      if (cart.cartStatus !== 'ACTIVE') {
        throw new BadRequestException('Cart is not in a valid state for cancellation');
      }

      // 2. Eliminar los cartItems relacionados primero
      await this.prisma.cartItem.deleteMany({
        where: { cartId: id }
      });

      // 3. Actualizar el estado del carrito a CANCELLED (o eliminar el carrito)
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
}
