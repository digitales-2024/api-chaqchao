import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AdminGateway } from '../admin.gateway';
import { OrderDetails, OrderInfo } from 'src/interfaces';

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
                  phone: true,
                  email: true
                }
              },
              cartItems: {
                select: {
                  id: true,
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      price: true
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
            ...(status === ('ALL' as unknown as OrderStatus) ? {} : { equals: status })
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
        client: {
          id: order.cart.client.id,
          name: order.cart.client.name,
          phone: order.cart.client.phone,
          email: order.cart.client.email
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
        client: {
          id: order.cart.client.id,
          name: order.cart.client.name,
          phone: order.cart.client.phone,
          email: order.cart.client.email
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
}
