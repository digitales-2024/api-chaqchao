import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Order } from '@prisma/client';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(Number(process.env.WEBSOCKET_PORT) || 5000, {
  cors: {
    origin: '*'
  }
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Pedidos
  // Emitir la creación de un nuevo pedido a los clientes
  sendOrderCreated(order: Order) {
    this.server.emit('new-order', order);
  }
  // Actualizar el estado de un pedido
  sendOrderStatusUpdated(orderId: string, status: string) {
    this.server.emit('order-status-updated', { orderId, status });
  }

  // Emitir la creación de una nueva clase a los clientes
  sendNewClassRegister(classId: string) {
    this.server.emit('new-class-register', { classId });
  }

  sendBusinessStatusUpdated(businessId: string, isOpen: boolean) {
    this.server.emit('business-schedule-updated', { businessId, isOpen });
  }

  // Activar o desactivar la disponibilidad de un producto
  sendProductAvailabilityUpdated(productId: string, isAvailable: boolean) {
    this.server.emit('product-availability-updated', { productId, isAvailable });
  }
}
