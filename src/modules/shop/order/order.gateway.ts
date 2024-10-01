import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(3003, { cors: true }) // Permitir CORS si es necesario
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  // Emitir la actualización a los clientes
  sendOrderStatusUpdate(orderId: string, status: string) {
    console.log('orderStatusUpdate', { orderId, status });
    this.server.emit('orderStatusUpdate', { orderId, status });
  }
}
