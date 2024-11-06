import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminGateway } from '../admin.gateway';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, AdminGateway],
  imports: [PrismaModule],
  exports: [OrdersService]
})
export class OrdersModule {}
