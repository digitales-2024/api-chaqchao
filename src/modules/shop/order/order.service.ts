import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { handleException } from 'src/utils';
import { CreateOrderDto } from './dto/create-order.dto';
import { HttpResponse, OrderInfo } from 'src/interfaces';
import * as moment from 'moment-timezone';
import { DayOfWeek } from '@prisma/client';
import { AdminGateway } from 'src/modules/admin/admin.gateway';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(forwardRef(() => AdminGateway))
    private readonly orderGateway: AdminGateway
  ) {}

  /**
   * Creacion de una nueva order
   * @param CreateOrderDto Data del Order
   * @returns Order creada correctamente
   */
  async create(CreateOrderDto: CreateOrderDto): Promise<HttpResponse<OrderInfo>> {
    const { cartId, orderStatus, pickupAddress, pickupTime, comments, someonePickup } =
      CreateOrderDto;
    let newOrder: OrderInfo;

    try {
      // Obtener el día actual de la semana
      const today = moment().format('dddd').toUpperCase() as DayOfWeek;

      // Buscar los horarios de atención para el día actual
      const businessHours = await this.prisma.businessHours.findFirst({
        where: { dayOfWeek: today, isOpen: true }
      });

      // Generar el código de recojo
      // Obtener el último Order con el pickupCode más alto
      const lastOrder = await this.prisma.order.findFirst({
        orderBy: {
          pickupCode: 'desc' // Ordenar en orden descendente para obtener el último código
        }
      });

      let nextPickupCodeNumber = 0; // Si no hay órdenes anteriores, comenzamos en 0
      if (lastOrder) {
        // Extraer el número de la cadena del código de recojo (ejemplo: P-000123 -> 123)
        nextPickupCodeNumber = parseInt(lastOrder.pickupCode.split('-')[1], 10) + 1;
      }

      // Formatear el nuevo código con ceros a la izquierda
      const nextPickupCode = `P-${nextPickupCodeNumber.toString().padStart(6, '0')}`;

      if (!businessHours) {
        throw new BadRequestException('The business is closed today.');
      }

      // Validar si la hora actual está dentro del rango de horarios permitidos
      const currentTime = moment.utc(pickupTime).tz('America/Lima').format('HH:mm');
      if (currentTime < businessHours.openingTime || currentTime > businessHours.closingTime) {
        throw new BadRequestException('Orders cannot be placed outside business hours.');
      }
      // Crear el nuevo Order
      newOrder = await this.prisma.$transaction(async () => {
        const order = await this.prisma.order.create({
          data: {
            pickupAddress,
            pickupTime,
            comments,
            orderStatus: orderStatus || 'PENDING',
            someonePickup,
            pickupCode: nextPickupCode || '',
            cart: {
              connect: {
                id: cartId
              }
            }
          },
          select: {
            id: true,
            orderStatus: true,
            pickupAddress: true,
            pickupTime: true,
            someonePickup: true,
            pickupCode: true,
            totalAmount: true,
            isActive: true,
            cart: {
              select: {
                id: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        });
        return {
          id: order.id,
          orderStatus: order.orderStatus,
          pickupAddress: order.pickupAddress,
          pickupTime: order.pickupTime,
          someonePickup: order.someonePickup,
          pickupCode: order.pickupCode,
          totalAmount: order.totalAmount,
          isActive: order.isActive,
          client: {
            id: order.cart.client.id,
            name: order.cart.client.name,
            email: order.cart.client.email,
            phone: order.cart.client.phone
          }
        };
      });
      this.orderGateway.sendOrderCreated(newOrder);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order created successfully',
        data: newOrder
      };
    } catch (error) {
      this.logger.error(`Error creating Order: ${error.message}`, error.stack);
      handleException(error, 'Error creating a Order');
    }
  }

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
        billingDocuments: {
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
}
