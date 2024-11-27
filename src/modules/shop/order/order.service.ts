import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { OrdersService } from 'src/modules/admin/orders/orders.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService
  ) {}

  /**
   * Obtenemos detalles del pedido, dirección del local, código único de recojo
   * @param orderId Identificador del pedido
   * @returns Los detalles del pedido y la dirección del local
   */
  async getOrderDetails(orderId: string): Promise<any> {
    // Obtener el pedido por ID y asegurarse que el cliente autenticado es el propietario
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId
      },
      include: {
        cart: {
          include: {
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
        },
        billingDocument: {
          where: { paymentStatus: 'PAID' }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(
        'No se encontró un pedido para este cliente o el pedido no existe.'
      );
    }

    // Calcular totalAmount sumando (precio del producto * cantidad)
    const totalAmount = order.cart.cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    // Actualizar el totalAmount en el pedido (Order)
    await this.prisma.order.update({
      where: { id: order.id },
      data: { totalAmount }
    });

    // Obtener la dirección del local desde BusinessConfig
    const businessConfig = await this.prisma.businessConfig.findFirst({
      select: { address: true }
    });

    // Retornar la información consolidada
    return {
      orderDetails: {
        order
      },
      businessAddress: businessConfig?.address
    };
  }

  /**
   * Obtener los pedidos de un cliente
   * @param id Id del cliente
   * @returns Pedidos del cliente
   */
  async getOrders(id: string): Promise<any> {
    try {
      const orders = await this.ordersService.findByClient(id);

      return orders;
    } catch (error) {
      this.logger.error(`Error getting orders for client id: ${id}`, error.stack);
      handleException(error, 'Error getting orders');
    }
  }
}
