import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);
  constructor(private readonly config: ConfigService) {}

  afterInit(server: Server) {
    const port = this.config.get('WEBSOCKET_PORT');
    server.listen(port);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emitir la creación de un nuevo pedido a los clientes
  sendOrderCreated(orderId: string) {
    this.server.emit('new-order', { orderId });
  }

  // Emitir la creación de una nueva clase a los clientes
  sendNewClassRegister(classId: string) {
    this.server.emit('new-class-register', { classId });
  }
}
