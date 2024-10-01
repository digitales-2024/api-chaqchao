import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';

@Injectable()
export class OrdersService {
  private logger = new Logger('OrdersService');
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(date: string): Promise<any> {
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
                      description: true,
                      image: true,
                      isAvailable: true,
                      category: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              },
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  birthDate: true
                }
              }
            }
          }
        },
        where: {
          pickupTime: {
            gte: formattedDate,
            lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      return orders.map((order) => ({
        ...order,
        clientName: order.cart.client.name,
        total: order.cart.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
      }));
    } catch (error) {
      this.logger.error('Error get orders', error.message);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get orders');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }
}
