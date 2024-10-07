import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrdersGateway } from './orders.gateway';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  imports: [PrismaModule],
  exports: [OrdersGateway]
})
export class OrdersModule {}
