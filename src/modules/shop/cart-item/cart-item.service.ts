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
   * Mostrar todos los cart items
   * @returns Todos los cart items
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
              id: true,
              cartStatus: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              productVariations: {
                select: {
                  id: true,
                  name: true,
                  additionalPrice: true
                }
              }
            }
          }
        }
      });

      // Mapea los resultados al tipo CartItemData
      return cartsItem.map((cartItem) => ({
        id: cartItem.id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        cart: {
          id: cartItem.cart.id,
          cartStatus: cartItem.cart.cartStatus
        },
        product: {
          id: cartItem.product.id,
          name: cartItem.product.name,
          price: cartItem.product.price,
          productVariations: cartItem.product.productVariations.map((variation) => ({
            id: variation.id,
            name: variation.name,
            additionalPrice: variation.additionalPrice
          }))
        }
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
    const { cartId, productId, quantity } = createCartItemDto;
    let newCartItem;

    try {
      // Validar el producto
      const product = await this.productService.findById(productId);
      if (!product) {
        throw new BadRequestException('Invalid productId provided');
      }

      // Crear el Cart Item
      newCartItem = await this.prisma.$transaction(async () => {
        // Crear el nuevo Cart Item
        const cartItem = await this.prisma.cartItem.create({
          data: {
            cartId,
            productId,
            quantity: parseFloat(quantity.toString()),
            price: product.price * quantity // Calcular el precio basado en la cantidad
          },
          select: {
            id: true,
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
                productVariations: true
              }
            }
          }
        });

        // Actualizar el estado del carrito a 'ACTIVE' si está en 'PENDING'
        if (cartItem.cart.cartStatus === 'PENDING') {
          await this.prisma.cart.update({
            where: { id: cartId },
            data: { cartStatus: 'ACTIVE' }
          });
        }

        return cartItem;
      });

      // Calcular el precio adicional total de las variaciones
      const additionalPriceTotal = newCartItem.product.productVariations.reduce(
        (sum, variation) => sum + variation.additionalPrice,
        0
      );

      // Calcular el precio final (precio base + precio adicional)
      const finalPrice = newCartItem.price + additionalPriceTotal;

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Cart Item created and cart status updated to ACTIVE',
        data: {
          id: newCartItem.id,
          cartId: newCartItem.cartId,
          productId: newCartItem.productId,
          quantity: newCartItem.quantity,
          price: newCartItem.price,
          finalPrice,
          cart: {
            id: newCartItem.cart.id,
            cartStatus: 'ACTIVE'
          },
          product: {
            id: newCartItem.product.id,
            name: newCartItem.product.name,
            price: newCartItem.product.price,
            productVariations: newCartItem.product.productVariations.map((variation) => ({
              id: variation.id,
              name: variation.name,
              additionalPrice: variation.additionalPrice
            }))
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Cart Item: ${error.message}`, error.stack);
      handleException(error, 'Error creating Cart Item');
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
            price: true,
            productVariations: true
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
        price: cartItemDB.product.price,
        productVariations: cartItemDB.product.productVariations
      }
    };
  }

  /**
   * Eliminar un item del carrito de compras
   * @param id Id del item del carrito
   * @returns Mensaje de confirmación de eliminación
   */
  async remove(id: string): Promise<HttpResponse<CartItemData>> {
    try {
      // Verificar si el item del carrito existe
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id }
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      const cartItemDelete: CartItemData = await this.prisma.cartItem.delete({
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
              price: true,
              productVariations: true
            }
          }
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product variation deleted',
        data: cartItemDelete
      };
    } catch (error) {
      this.logger.error(`Error deleting product variation by id ${id}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deleting product variation');
    }
  }

  /**
   * Actualizar la cantidad de un item en el carrito de compras
   * @param id Id del item del carrito
   * @param quantity Nueva cantidad para el item
   * @returns Item del carrito actualizado
   */
  async updateQuantity(id: string, quantity: number): Promise<HttpResponse<CartItemData>> {
    let updatedCartItem;

    try {
      // Buscar el item del carrito
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id },
        include: { product: true } // Incluir los datos del producto para obtener el precio unitario
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      // Recalcular el precio basado en la nueva cantidad
      const newPrice = parseFloat((cartItem.product.price * quantity).toFixed(2));

      // Actualizar la cantidad y el precio
      updatedCartItem = await this.prisma.cartItem.update({
        where: { id },
        data: {
          quantity: parseFloat(quantity.toString()),
          price: newPrice
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

      return {
        statusCode: HttpStatus.OK,
        message: 'Cart item updated successfully',
        data: updatedCartItem
      };
    } catch (error) {
      this.logger.error(`Error updating Cart Item quantity: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating Cart Item quantity');
    }
  }
}
