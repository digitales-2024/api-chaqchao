import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { OrderInfo } from 'src/interfaces';

@WebSocketGateway(Number(process.env.WEBSOCKET_PORT) || 5000, { cors: true })
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
  sendOrderCreated(order: OrderInfo) {
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
}
