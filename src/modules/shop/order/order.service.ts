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
import { OrderData } from 'src/interfaces/order.interface';
import { handleException } from 'src/utils';
import { CreateOrderDto } from './dto/create-order.dto';
import { HttpResponse } from 'src/interfaces';
import { UpdateStatusOrderDto } from './dto/update-status-order.dto';
import * as moment from 'moment-timezone';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService
  ) {}

  /**
   * Mostrar todos los order
   * @returns Todos los carts
   */
  async findAll(): Promise<OrderData[]> {
    try {
      const orders = await this.prisma.order.findMany({
        where: {},
        select: {
          id: true,
          orderStatus: true,
          pickupAddress: true,
          pickupTime: true,
          comments: true,
          isActive: true,
          cartId: true
        }
      });
      //Mapea los resultados al tipo OrderData
      return orders.map((order) => ({
        id: order.id,
        orderStatus: order.orderStatus,
        pickupAddress: order.pickupAddress,
        pickupTime: order.pickupTime,
        comments: order.comments,
        isActive: order.isActive,
        cartId: order.cartId
      })) as OrderData[];
    } catch (error) {
      this.logger.error('Error getting all orders');
      handleException(error, 'Error getting all orders');
    }
  }

  /**
   * Creacion de una nueva order
   * @param CreateOrderDto Data del Order
   * @returns Order creada correctamente
   */
  async create(CreateOrderDto: CreateOrderDto): Promise<HttpResponse<OrderData>> {
    const { cartId, orderStatus, pickupAddress, pickupTime, comments } = CreateOrderDto;
    let newOrder;

    try {
      // Obtener el día actual de la semana
      const today = moment().format('dddd').toUpperCase() as DayOfWeek;

      // Buscar los horarios de atención para el día actual
      const businessHours = await this.prisma.businessHours.findFirst({
        where: { dayOfWeek: today, isOpen: true }
      });

      if (!businessHours) {
        throw new BadRequestException('The business is closed today.');
      }

      // Validar si la hora actual está dentro del rango de horarios permitidos
      const currentTime = moment.utc(pickupTime).tz('America/Lima-5').format('HH:mm');
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
            cart: {
              connect: {
                id: cartId
              }
            }
          },
          select: {
            id: true,
            cartId: true,
            pickupAddress: true,
            pickupTime: true,
            comments: true,
            cart: {
              select: {
                id: true
              }
            }
          }
        });
        return order;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order created successfully',
        data: {
          id: newOrder.id,
          cartId: newOrder.cartId,
          orderStatus: newOrder.orderStatus,
          pickupAddress: newOrder.pickupAddress,
          pickupTime: newOrder.pickupTime,
          comments: newOrder.comments,
          isActive: newOrder.isActive,
          cart: {
            id: newOrder.id
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Order: ${error.message}`, error.stack);
      handleException(error, 'Error creating a Order');
    }
  }

  /**
   * Actualiza solo el estado de un Order
   * @param id Identificador del Order
   * @param updateOrderStatusDto Contiene el nuevo estado del Order
   * @returns Order actualizado con el nuevo estado
   */
  async updateOrderStatus(
    id: string,
    updateStatusOrderDto: UpdateStatusOrderDto
  ): Promise<HttpResponse<OrderData>> {
    const { orderStatus } = updateStatusOrderDto;

    try {
      // Actualizar solo el campo orderStatus
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: { orderStatus },
        select: {
          id: true,
          orderStatus: true,
          pickupAddress: true,
          pickupTime: true,
          comments: true,
          isActive: true,
          cartId: true,
          cart: {
            select: {
              id: true
            }
          }
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Order status updated successfully',
        data: updatedOrder
      };
    } catch (error) {
      this.logger.error(`Error updating Order status: ${error.message}`, error.stack);
      handleException(error, 'Error updating Order status');
    }
  }

  /**
   * Obtenemos detalles del pedido, direccion del local, codigo unico de recojo
   * @param clientId para obtener la informacion del Client
   * @returns El codigo unico se genera cuando se haya realizado el pago el billingDocumentType esta en 'PAID'
   * @returns los detalles del Pedido
   * @returns la direccion del local la obtenemos desde un modulo llamado Bussiness config que tiene el address
   */
  async getOrderDetails(clientId: string): Promise<any> {
    // Obtener el pedido (Order) activo o pendiente del cliente
    const order = await this.prisma.order.findFirst({
      where: {
        cart: { clientId },
        orderStatus: 'PENDING'
      },
      include: {
        cart: {
          include: {
            cartItems: true
          }
        },
        billingDocuments: {
          where: { paymentStatus: 'PENDING' } //Deberia ser PAID
        }
      }
    });

    if (!order) {
      throw new NotFoundException('No se encontró un pedido para este cliente.');
    }

    // Obtener la dirección del local desde BusinessConfig
    const businessConfig = await this.prisma.businessConfig.findFirst({
      select: { address: true }
    });

    // Generar el código de recojo solo si el pedido está en status PAID
    let pickupCode: string | null = null;
    if (order.billingDocuments.length > 0) {
      pickupCode = `PU-${order.id}-${Date.now()}`;
    }

    // Retornar la información consolidada
    return {
      orderDetails: order,
      businessAddress: businessConfig?.address,
      pickupCode: pickupCode
    };
  }
}
