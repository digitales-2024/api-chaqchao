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
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CartItemData } from 'src/interfaces/cart-item.interface';
import { HttpResponse } from 'src/interfaces';
import { ProductsService } from 'src/modules/admin/products/products.service';
import { CartService } from '../cart/cart.service';
import { handleException } from 'src/utils';

@Injectable()
export class CartItemService {
  private readonly logger = new Logger(CartItemService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productService: ProductsService
  ) {}

  /**
   * Mostrar todos los productos
   * @returns Todos los productos
   */
  async findAll(): Promise<CartItemData[]> {
    try {
      const cartsItem = await this.prisma.cartItem.findMany({
        where: {},
        select: {
          id: true,
          quantity: true,
          price: true,
          cart: {
            select: {
              id: true
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Mapea los resultados al tipo ProductData
      return cartsItem.map((cartItem) => ({
        id: cartItem.id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        cart: cartItem.cart,
        product: cartItem.product
      })) as CartItemData[];
    } catch (error) {
      this.logger.error('Error getting all carts items');
      handleException(error, 'Error getting all carts items');
    }
  }

  /**
   * Creacion de un nuevo item en el carrito de compras
   * @param createCartItemDto Data del item para el carrito de compras
   * @returns Item para el Carrito de compras creado
   */
  async create(createCartItemDto: CreateCartItemDto): Promise<HttpResponse<CartItemData>> {
    const { cartId, productId, quantity, price } = createCartItemDto;
    let newCartItem;

    try {
      // Validar el product si se proporciona un productId
      if (productId) {
        const cartItemDB = await this.productService.findById(productId);
        if (!cartItemDB) {
          throw new BadRequestException('Invalid productId provided');
        }
      }

      // Crear el Cart Item
      newCartItem = await this.prisma.$transaction(async () => {
        // Crear el nuevo Cart Item
        const cartItem = await this.prisma.cartItem.create({
          data: {
            cartId,
            productId,
            quantity: parseFloat(quantity.toString()),
            price: parseFloat(price.toString())
          },
          select: {
            id: true,
            quantity: true,
            price: true,
            cart: {
              select: {
                id: true
              }
            },
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        return cartItem;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Cart Item created successfully',
        data: {
          id: newCartItem.id,
          cartId: newCartItem.cartId,
          productId: newCartItem.productId,
          quantity: newCartItem.quantity,
          price: newCartItem.price,
          cart: {
            id: newCartItem.cart.id,
            cartStatus: newCartItem.cartStatus
          },
          product: {
            id: newCartItem.product.id,
            name: newCartItem.product.name,
            price: newCartItem.product.price
          }
        }
      };
    } catch (error) {
      this.logger.error('Error creating Cart Item: ${error.message}', error.stack);

      if (newCartItem) {
        await this.prisma.cartItem.delete({ where: { id: newCartItem.id } });
        this.logger.error(
          'Cart Item with ID ${newCartItem.id} has been deleted due to error in creation.'
        );
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a Cart Item');
    }
  }

  /**
   * Valida si es que existe el carrito de compras por id
   * @param id Id del item del carrito
   * @returns Si existe el item del carrito de compras te retorna el mensaje de error si no te retorna el item
   */
  async findById(id: string): Promise<CartItemData> {
    const cartItemDB = await this.prisma.cartItem.findFirst({
      where: { id },
      select: {
        id: true,
        cartId: true,
        productId: true,
        quantity: true,
        price: true,
        cart: {
          select: {
            id: true,
            cartStatus: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });
    if (!cartItemDB) {
      throw new BadRequestException('This cart doesnt exist');
    }
    if (!!cartItemDB && !cartItemDB.cartId) {
      throw new BadRequestException('This cart exist, but is inactive');
    }

    // Mapeo al tipo CartItemData
    return {
      id: cartItemDB.id,
      cartId: cartItemDB.cartId,
      productId: cartItemDB.productId,
      quantity: cartItemDB.quantity,
      price: cartItemDB.price,
      cart: {
        id: cartItemDB.cart.id,
        cartStatus: cartItemDB.cart.cartStatus
      },
      product: {
        id: cartItemDB.product.id,
        name: cartItemDB.product.name,
        price: cartItemDB.product.price
      }
    };
  }
}
