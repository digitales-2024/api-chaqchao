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
    const { clientId, cartStatus } = createCartDto;
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
            cartStatus
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
}
