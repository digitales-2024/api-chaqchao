import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { OrdersService } from 'src/modules/admin/orders/orders.service';
import { OrderDetails } from 'src/interfaces';

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
  async getOrderDetails(orderId: string): Promise<OrderDetails> {
    // Obtener el pedido por ID y asegurarse que el cliente autenticado es el propietario
    const order = await this.ordersService.findOne(orderId);

    if (!order) {
      throw new NotFoundException(
        'No se encontró un pedido para este cliente o el pedido no existe.'
      );
    }

    return order;
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

  /**
   * Exportar un pedido en formato PDF
   * @param orderId Identificador del pedido
   * @returns Código del pedido y buffer del PDF
   */
  async exportPdfOrder(orderId: string): Promise<any> {
    try {
      return await this.ordersService.exportPdf(orderId);
    } catch (error) {
      this.logger.error(`Error exporting order id: ${orderId}`, error.stack);
      handleException(error, 'Error exporting order');
    }
  }
}
